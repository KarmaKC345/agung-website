import { slugify, type ProductInput } from '@newagung/shared';
import type { DbClient, Queryable } from '../db';
import { HttpError } from '../errors';

/** Cari slug yang belum dipakai: "nama", "nama-2", "nama-3", ... */
export async function uniqueSlug(
  db: Queryable,
  table: 'products' | 'categories' | 'brands',
  base: string,
  exceptId?: string,
): Promise<string> {
  const root = slugify(base) || 'barang';
  const { rows } = await db.query<{ slug: string }>(
    `select slug from ${table} where (slug = $1 or slug like $2) and ($3::uuid is null or id <> $3)`,
    [root, `${root}-%`, exceptId ?? null],
  );
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

type PriceUpsert = { unit: string; qtyPerUnit: number; price: number; originalPrice?: number | null };

/**
 * Simpan harga per satuan. originalPrice: angka = harga coret baru, null = hapus promo,
 * undefined = biarkan harga coret lama (dipakai import tanpa kolom harga_coret).
 * Harga coret lama yang tidak lagi lebih besar dari harga baru otomatis dilepas.
 */
export async function upsertVariantPrices(
  c: DbClient,
  variantId: string,
  prices: PriceUpsert[],
  opts: { removeMissing: boolean },
): Promise<void> {
  for (const p of prices) {
    const keep = p.originalPrice === undefined;
    await c.query(
      `insert into variant_prices (variant_id, unit, qty_per_unit, price, original_price) values ($1, $2, $3, $4, $5)
       on conflict (variant_id, unit) do update set
         qty_per_unit = excluded.qty_per_unit,
         price = excluded.price,
         original_price = case
           when not $6::boolean then excluded.original_price
           when variant_prices.original_price > excluded.price then variant_prices.original_price
           else null end`,
      [variantId, p.unit, p.qtyPerUnit, p.price, keep ? null : p.originalPrice, keep],
    );
  }
  if (opts.removeMissing) {
    await c.query('delete from variant_prices where variant_id = $1 and unit <> all($2)', [
      variantId,
      prices.map((p) => p.unit),
    ]);
  }
}

/** Simpan barang beserta varian, harga, dan foto. Mengembalikan id barang. */
export async function saveProduct(c: DbClient, id: string | null, input: ProductInput): Promise<{ id: string; slug: string }> {
  // Saat mengubah barang tanpa slug baru, alamat lama dipertahankan agar tautan yang sudah
  // dibagikan dan hasil Google tidak rusak walau nama barang diganti.
  const current = id && !input.slug ? (await c.query<{ slug: string }>('select slug from products where id = $1', [id])).rows[0]?.slug : undefined;
  const slug = current ?? (await uniqueSlug(c, 'products', input.slug || input.name, id ?? undefined));
  let productId: string;

  if (id) {
    const { rows } = await c.query<{ id: string }>(
      `update products set name = $2, slug = $3, description = $4, category_id = $5, brand_id = $6, is_active = $7, is_featured = $8
        where id = $1 returning id`,
      [id, input.name, slug, input.description, input.categoryId, input.brandId, input.isActive, input.isFeatured],
    );
    if (!rows[0]) throw new HttpError(404, 'Barang tidak ditemukan');
    productId = id;
  } else {
    const { rows } = await c.query<{ id: string }>(
      `insert into products (name, slug, description, category_id, brand_id, is_active, is_featured)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [input.name, slug, input.description, input.categoryId, input.brandId, input.isActive, input.isFeatured],
    );
    productId = rows[0]!.id;
  }

  const { rows: existing } = await c.query<{ id: string }>('select id from product_variants where product_id = $1', [productId]);
  const existingIds = new Set(existing.map((r) => r.id));
  const keep: string[] = [];

  for (const [i, v] of input.variants.entries()) {
    let variantId: string;
    if (v.id && existingIds.has(v.id)) {
      await c.query(
        `update product_variants set label = $2, color_hex = $3, sku = $4, stock_status = $5, sort_order = $6 where id = $1`,
        [v.id, v.label, v.colorHex, v.sku, v.stockStatus, i],
      );
      variantId = v.id;
    } else {
      const { rows } = await c.query<{ id: string }>(
        `insert into product_variants (product_id, label, color_hex, sku, stock_status, sort_order)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [productId, v.label, v.colorHex, v.sku, v.stockStatus, i],
      );
      variantId = rows[0]!.id;
    }
    keep.push(variantId);
    await upsertVariantPrices(c, variantId, v.prices, { removeMissing: true });
  }
  await c.query('delete from product_variants where product_id = $1 and id <> all($2::uuid[])', [productId, keep]);

  await c.query('delete from product_images where product_id = $1', [productId]);
  if (input.images.length) {
    await c.query(
      `insert into product_images (product_id, path, sort_order)
       select $1, path, ord - 1 from unnest($2::text[]) with ordinality as t(path, ord)`,
      [productId, input.images],
    );
  }
  return { id: productId, slug };
}

export interface PriceRow {
  variantPriceId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  unit: string;
  qtyPerUnit: number;
  price: number;
  stockStatus: string;
  brand: string | null;
  updatedAt: string;
}

export async function listPriceRows(
  db: Queryable,
  opts: { q?: string; categoryId?: string; brandId?: string; limit: number; offset: number },
): Promise<{ items: PriceRow[]; total: number }> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.q) {
    params.push(`%${opts.q.toLowerCase()}%`);
    where.push(`p.search_text like $${params.length}`);
  }
  if (opts.categoryId) {
    params.push(opts.categoryId);
    where.push(`(p.category_id = $${params.length} or p.category_id in (select id from categories where parent_id = $${params.length}))`);
  }
  if (opts.brandId) {
    params.push(opts.brandId);
    where.push(`p.brand_id = $${params.length}`);
  }
  params.push(opts.limit, opts.offset);
  const { rows } = await db.query<PriceRow & { total: number }>(
    `select vp.id as "variantPriceId", p.id as "productId", p.name as "productName", v.label as "variantLabel",
            vp.unit, vp.qty_per_unit as "qtyPerUnit", vp.price, v.stock_status as "stockStatus", b.name as brand,
            p.updated_at as "updatedAt", count(*) over()::int as total
       from variant_prices vp
       join product_variants v on v.id = vp.variant_id
       join products p on p.id = v.product_id
       left join brands b on b.id = p.brand_id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by p.name, v.sort_order, vp.qty_per_unit
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0 };
}
