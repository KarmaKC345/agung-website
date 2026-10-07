import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import type { StockStatus } from '@newagung/shared';
import { withTx, type Db, type DbClient, type Queryable } from '../db';
import { HttpError } from '../errors';
import { uniqueSlug, upsertVariantPrices } from './products-admin';

/**
 * Format import/export (satu baris = satu harga satuan):
 * kategori, merek, nama, varian, warna, sku, satuan, isi, harga, stok, deskripsi
 *
 * - Baris dengan "nama" sama → satu barang.
 * - Baris dengan "nama" + "varian" sama → satu varian, tiap baris satu satuan harga.
 * - Import bersifat menambah/memperbarui; varian yang tidak ada di file tidak dihapus.
 */
export const COLUMNS = ['kategori', 'merek', 'nama', 'varian', 'warna', 'sku', 'satuan', 'isi', 'harga', 'stok', 'deskripsi'] as const;
type Column = (typeof COLUMNS)[number];
type RawRow = Partial<Record<Column, string>>;

export interface ImportResult {
  products: number;
  created: number;
  updated: number;
  prices: number;
  errors: { row: number; message: string }[];
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z_]/g, '');
}

export async function parseSheet(buffer: Buffer, filename: string): Promise<RawRow[]> {
  if (/\.xlsx$/i.test(filename)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const headers: string[] = [];
    ws.getRow(1).eachCell((cell, col) => {
      headers[col] = normalizeHeader(String(cell.text ?? ''));
    });
    const rows: RawRow[] = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const rec: Record<string, string> = {};
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = headers[col];
        if (key) rec[key] = String(cell.text ?? '').trim();
      });
      rows.push(rec);
    });
    return rows;
  }
  if (/\.csv$/i.test(filename)) {
    const text = buffer.toString('utf8').replace(/^﻿/, '');
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      // baris kosong tetap dibaca agar nomor baris di laporan error sesuai file
      skipEmptyLines: false,
      transformHeader: normalizeHeader,
      transform: (v) => v.trim(),
    });
    return parsed.data;
  }
  throw new HttpError(415, 'File harus .csv atau .xlsx');
}

function parsePrice(v: string | undefined): number | null {
  if (!v) return null;
  // "Rp12.500" / "12.500" / "12500" → 12500
  const digits = v.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

const STOCK: Record<string, StockStatus> = { ada: 'ada', sedikit: 'sedikit', habis: 'habis', kosong: 'habis' };

async function findOrCreate(c: DbClient, table: 'categories' | 'brands', name: string, cache: Map<string, string>): Promise<string> {
  const key = name.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const { rows } = await c.query<{ id: string }>(`select id from ${table} where lower(name) = $1 or slug = $1 limit 1`, [key]);
  let id = rows[0]?.id;
  if (!id) {
    const slug = await uniqueSlug(c, table, name);
    const res = await c.query<{ id: string }>(`insert into ${table} (name, slug) values ($1, $2) returning id`, [name, slug]);
    id = res.rows[0]!.id;
  }
  cache.set(key, id);
  return id;
}

export async function importRows(db: Db, rows: RawRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = { products: 0, created: 0, updated: 0, prices: 0, errors: [] };
  if (rows.length > 20_000) throw new HttpError(413, 'Maksimal 20.000 baris per import');

  // kelompokkan per nama barang, simpan nomor baris asli (header = baris 1)
  const groups = new Map<string, { rows: { row: number; data: RawRow }[] }>();
  rows.forEach((data, i) => {
    const row = i + 2;
    const name = data.nama?.trim();
    if (!name) {
      if (Object.values(data).some((v) => v)) result.errors.push({ row, message: 'Kolom "nama" kosong' });
      return;
    }
    const price = parsePrice(data.harga);
    if (price === null) {
      result.errors.push({ row, message: 'Kolom "harga" kosong atau bukan angka' });
      return;
    }
    const key = name.toLowerCase();
    if (!groups.has(key)) groups.set(key, { rows: [] });
    groups.get(key)!.rows.push({ row, data });
  });

  await withTx(
    db,
    async (c) => {
      const catCache = new Map<string, string>();
      const brandCache = new Map<string, string>();

      for (const { rows: grp } of groups.values()) {
        const first = grp[0]!.data;
        const name = first.nama!.trim();
        const categoryId = first.kategori ? await findOrCreate(c, 'categories', first.kategori, catCache) : null;
        const brandId = first.merek ? await findOrCreate(c, 'brands', first.merek, brandCache) : null;

        const { rows: found } = await c.query<{ id: string }>('select id from products where lower(name) = $1 limit 1', [
          name.toLowerCase(),
        ]);
        let productId = found[0]?.id;
        if (productId) {
          await c.query(
            `update products set category_id = coalesce($2, category_id), brand_id = coalesce($3, brand_id),
                    description = case when $4 = '' then description else $4 end
              where id = $1`,
            [productId, categoryId, brandId, first.deskripsi ?? ''],
          );
          result.updated++;
        } else {
          const slug = await uniqueSlug(c, 'products', name);
          const ins = await c.query<{ id: string }>(
            `insert into products (name, slug, description, category_id, brand_id) values ($1, $2, $3, $4, $5) returning id`,
            [name, slug, first.deskripsi ?? '', categoryId, brandId],
          );
          productId = ins.rows[0]!.id;
          result.created++;
        }
        result.products++;

        const byVariant = new Map<string, { row: number; data: RawRow }[]>();
        for (const r of grp) {
          const label = (r.data.varian ?? '').trim();
          if (!byVariant.has(label)) byVariant.set(label, []);
          byVariant.get(label)!.push(r);
        }

        let order = 0;
        for (const [label, vrows] of byVariant) {
          const v0 = vrows[0]!.data;
          const color = v0.warna && /^#?[0-9a-f]{6}$/i.test(v0.warna) ? `#${v0.warna.replace('#', '')}` : null;
          const stock = STOCK[(v0.stok ?? '').toLowerCase()] ?? 'ada';
          const { rows: vfound } = await c.query<{ id: string }>(
            'select id from product_variants where product_id = $1 and lower(label) = $2 limit 1',
            [productId, label.toLowerCase()],
          );
          let variantId = vfound[0]?.id;
          if (variantId) {
            await c.query(
              `update product_variants set color_hex = coalesce($2, color_hex), sku = coalesce(nullif($3, ''), sku), stock_status = $4
                where id = $1`,
              [variantId, color, v0.sku ?? '', stock],
            );
          } else {
            const vins = await c.query<{ id: string }>(
              `insert into product_variants (product_id, label, color_hex, sku, stock_status, sort_order)
               values ($1, $2, $3, nullif($4, ''), $5, $6) returning id`,
              [productId, label, color, v0.sku ?? '', stock, order],
            );
            variantId = vins.rows[0]!.id;
          }
          order++;

          const prices = vrows.map((r) => ({
            unit: (r.data.satuan || 'pcs').toLowerCase(),
            qtyPerUnit: Math.max(1, Number(r.data.isi) || 1),
            price: parsePrice(r.data.harga)!,
          }));
          await upsertVariantPrices(c, variantId, prices, { removeMissing: false });
          result.prices += prices.length;
        }
      }
    },
    userId,
  );

  return result;
}

export async function exportRows(db: Queryable): Promise<string> {
  const { rows } = await db.query<Record<Column, string | number | null>>(
    `select coalesce(c.name, '') as kategori, coalesce(b.name, '') as merek, p.name as nama, v.label as varian,
            coalesce(v.color_hex, '') as warna, coalesce(v.sku, '') as sku, vp.unit as satuan, vp.qty_per_unit as isi,
            vp.price as harga, v.stock_status as stok, p.description as deskripsi
       from products p
       join product_variants v on v.product_id = p.id
       join variant_prices vp on vp.variant_id = v.id
       left join categories c on c.id = p.category_id
       left join brands b on b.id = p.brand_id
      order by p.name, v.sort_order, vp.qty_per_unit`,
  );
  return '﻿' + Papa.unparse({ fields: [...COLUMNS], data: rows.map((r) => COLUMNS.map((k) => r[k] ?? '')) });
}

export function templateCsv(): string {
  return (
    '﻿' +
    Papa.unparse({
      fields: [...COLUMNS],
      data: [
        ['Pulpen', 'Standard', 'Standard AE7 Alfa Tip 0.5', 'Hitam', '#1B1B1B', '', 'pcs', 1, 2500, 'ada', 'Pulpen sehari-hari'],
        ['Pulpen', 'Standard', 'Standard AE7 Alfa Tip 0.5', 'Hitam', '#1B1B1B', '', 'lusin', 12, 27000, 'ada', ''],
        ['Pulpen', 'Standard', 'Standard AE7 Alfa Tip 0.5', 'Biru', '#1F3FAE', '', 'pcs', 1, 2500, 'ada', ''],
        ['Kertas', 'SiDU', 'Kertas HVS SiDU A4 70 gsm', 'A4', '', '', 'rim', 1, 52000, 'ada', '500 lembar per rim'],
      ],
    })
  );
}
