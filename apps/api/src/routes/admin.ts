import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  bannerInputSchema,
  brandInputSchema,
  bulkPriceSchema,
  categoryInputSchema,
  orderStatusInputSchema,
  orderStatusSchema,
  priceUpdateSchema,
  productInputSchema,
  staffInviteSchema,
  staffUpdateSchema,
  storeInputSchema,
} from '@newagung/shared';
import { createClient } from '@supabase/supabase-js';
import type { Ctx } from '../app';
import { createAuth, ownerOnly } from '../auth';
import { withTx } from '../db';
import { HttpError, notFound } from '../errors';
import { getProduct, listBanners, listBrands, listCategories } from '../lib/catalog';
import { exportRows, importRows, parseSheet, templateCsv } from '../lib/importer';
import { listOrders, setOrderStatus } from '../lib/orders';
import { listPriceRows, saveProduct, uniqueSlug } from '../lib/products-admin';
import { getStore } from '../lib/store';

const idParam = z.object({ id: z.uuid() });
const page = z.coerce.number().int().min(1).default(1);

export function adminRoutes(ctx: Ctx): Router {
  const { db, env, revalidate, storeImage } = ctx;
  const r = Router();
  r.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  r.use(createAuth(env, db));

  const images = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  });
  const sheets = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

  r.get('/me', (req, res) => {
    res.json(req.staff);
  });

  // ---------------------------------------------------------------- barang
  r.get('/products', async (req, res) => {
    const q = z
      .object({
        q: z.string().trim().max(100).optional(),
        categoryId: z.uuid().optional(),
        status: z.enum(['aktif', 'nonaktif', 'semua']).default('semua'),
        page,
      })
      .parse(req.query);
    const params: unknown[] = [];
    const where: string[] = [];
    if (q.q) {
      params.push(`%${q.q.toLowerCase()}%`);
      where.push(`p.search_text like $${params.length}`);
    }
    if (q.categoryId) {
      params.push(q.categoryId);
      where.push(`(p.category_id = $${params.length} or c.parent_id = $${params.length})`);
    }
    if (q.status !== 'semua') where.push(q.status === 'aktif' ? 'p.is_active' : 'not p.is_active');
    params.push(30, (q.page - 1) * 30);
    const { rows } = await db.query(
      `select p.id, p.name, p.slug, p.is_active as "isActive", p.updated_at as "updatedAt",
              c.name as category, b.name as brand,
              (select count(*) from product_variants v where v.product_id = p.id)::int as "variantCount",
              (select min(vp.price) from variant_prices vp join product_variants v on v.id = vp.variant_id
                where v.product_id = p.id) as "minPrice",
              (select i.path from product_images i where i.product_id = p.id order by i.sort_order limit 1) as image,
              count(*) over()::int as total
         from products p
         left join categories c on c.id = p.category_id
         left join brands b on b.id = p.brand_id
        ${where.length ? `where ${where.join(' and ')}` : ''}
        order by p.updated_at desc
        limit $${params.length - 1} offset $${params.length}`,
      params,
    );
    res.json({ items: rows.map(({ total: _t, ...row }) => row), total: rows[0]?.total ?? 0, page: q.page, pageSize: 30 });
  });

  r.get('/products/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const product = await getProduct(db, { id }, { includeInactive: true });
    if (!product) throw notFound('Barang');
    res.json(product);
  });

  r.post('/products', async (req, res) => {
    const input = productInputSchema.parse(req.body);
    const saved = await withTx(db, (c) => saveProduct(c, null, input), req.staff!.userId);
    revalidate(['products', 'categories', 'brands']);
    res.status(201).json(saved);
  });

  r.put('/products/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const input = productInputSchema.parse(req.body);
    const before = await db.query<{ slug: string }>('select slug from products where id = $1', [id]);
    const saved = await withTx(db, (c) => saveProduct(c, id, input), req.staff!.userId);
    revalidate(['products', 'categories', 'brands', `product:${saved.slug}`, `product:${before.rows[0]?.slug ?? ''}`]);
    res.json(saved);
  });

  r.delete('/products/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { rows } = await db.query<{ slug: string }>('delete from products where id = $1 returning slug', [id]);
    if (!rows[0]) throw notFound('Barang');
    revalidate(['products', 'categories', 'brands', `product:${rows[0].slug}`]);
    res.status(204).end();
  });

  r.post('/uploads', images.array('files', 5), async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) throw new HttpError(400, 'Tidak ada foto yang diunggah');
    const urls = [];
    for (const f of files) urls.push(await storeImage(f));
    res.status(201).json({ urls });
  });

  // ---------------------------------------------------------------- harga
  r.get('/prices', async (req, res) => {
    const q = z
      .object({
        q: z.string().trim().max(100).optional(),
        categoryId: z.uuid().optional(),
        brandId: z.uuid().optional(),
        page,
      })
      .parse(req.query);
    const result = await listPriceRows(db, { ...q, limit: 50, offset: (q.page - 1) * 50 });
    res.json({ ...result, page: q.page, pageSize: 50 });
  });

  r.patch('/prices/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { price } = priceUpdateSchema.parse(req.body);
    const slug = await withTx(
      db,
      async (c) => {
        const { rows } = await c.query<{ slug: string }>(
          `update variant_prices vp set price = $2,
                  original_price = case when vp.original_price > $2 then vp.original_price else null end
             from product_variants v join products p on p.id = v.product_id
            where vp.id = $1 and v.id = vp.variant_id
            returning p.slug`,
          [id, price],
        );
        return rows[0]?.slug;
      },
      req.staff!.userId,
    );
    if (!slug) throw notFound('Harga');
    revalidate(['products', `product:${slug}`]);
    res.json({ id, price });
  });

  r.post('/prices/bulk', ownerOnly, async (req, res) => {
    const input = bulkPriceSchema.parse(req.body);
    if (!input.brandId && !input.categoryId) throw new HttpError(400, 'Pilih merek atau kategori');
    const updated = await withTx(
      db,
      async (c) => {
        const { rowCount } = await c.query(
          `update variant_prices vp
              set price = greatest(0, round(vp.price * (1 + $1::numeric / 100) / $2) * $2),
                  -- harga coret ikut naik/turun dengan persentase yang sama
                  original_price = case
                    when vp.original_price is not null
                     and round(vp.original_price * (1 + $1::numeric / 100) / $2) * $2
                       > greatest(0, round(vp.price * (1 + $1::numeric / 100) / $2) * $2)
                    then round(vp.original_price * (1 + $1::numeric / 100) / $2) * $2
                    else null end
             from product_variants v join products p on p.id = v.product_id
            where v.id = vp.variant_id
              and ($3::uuid is null or p.brand_id = $3)
              and ($4::uuid is null or p.category_id = $4 or p.category_id in (select id from categories where parent_id = $4))`,
          [input.percent, input.roundTo, input.brandId ?? null, input.categoryId ?? null],
        );
        return rowCount ?? 0;
      },
      req.staff!.userId,
    );
    revalidate(['products']);
    res.json({ updated });
  });

  r.get('/prices/history/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { rows } = await db.query(
      `select h.old_price as "oldPrice", h.new_price as "newPrice", h.changed_at as "changedAt", s.email as "changedBy"
         from price_history h left join staff s on s.user_id = h.changed_by
        where h.variant_price_id = $1 order by h.changed_at desc limit 20`,
      [id],
    );
    res.json(rows);
  });

  // ---------------------------------------------------------------- kategori & merek
  r.get('/categories', async (_req, res) => {
    res.json(await listCategories(db));
  });

  r.post('/categories', ownerOnly, async (req, res) => {
    const input = categoryInputSchema.parse(req.body);
    const slug = await uniqueSlug(db, 'categories', input.slug || input.name);
    const { rows } = await db.query(
      `insert into categories (name, slug, parent_id, sort_order) values ($1, $2, $3, $4) returning id, slug`,
      [input.name, slug, input.parentId, input.sortOrder],
    );
    revalidate(['categories']);
    res.status(201).json(rows[0]);
  });

  r.put('/categories/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const input = categoryInputSchema.parse(req.body);
    if (input.parentId === id) throw new HttpError(400, 'Kategori tidak bisa jadi induk dirinya sendiri');
    if (input.parentId) {
      const { rows } = await db.query('select 1 from categories where id = $1 and parent_id is not null', [input.parentId]);
      if (rows.length) throw new HttpError(400, 'Maksimal 2 tingkat kategori');
      const { rows: kids } = await db.query('select 1 from categories where parent_id = $1 limit 1', [id]);
      if (kids.length) throw new HttpError(400, 'Kategori ini punya sub-kategori, jadi tidak bisa dipindah ke bawah kategori lain');
    }
    const slug = await uniqueSlug(db, 'categories', input.slug || input.name, id);
    const { rowCount } = await db.query(
      `update categories set name = $2, slug = $3, parent_id = $4, sort_order = $5 where id = $1`,
      [id, input.name, slug, input.parentId, input.sortOrder],
    );
    if (!rowCount) throw notFound('Kategori');
    revalidate(['categories', 'products']);
    res.json({ id, slug });
  });

  r.post('/categories/reorder', ownerOnly, async (req, res) => {
    const ids = z.array(z.uuid()).max(500).parse(req.body?.ids);
    await db.query(
      `update categories c set sort_order = t.ord from unnest($1::uuid[]) with ordinality as t(id, ord) where c.id = t.id`,
      [ids],
    );
    revalidate(['categories']);
    res.json({ ok: true });
  });

  r.delete('/categories/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { rowCount } = await db.query('delete from categories where id = $1', [id]);
    if (!rowCount) throw notFound('Kategori');
    revalidate(['categories', 'products']);
    res.status(204).end();
  });

  r.get('/brands', async (_req, res) => {
    res.json(await listBrands(db));
  });

  r.post('/brands', async (req, res) => {
    const input = brandInputSchema.parse(req.body);
    const slug = await uniqueSlug(db, 'brands', input.slug || input.name);
    const { rows } = await db.query('insert into brands (name, slug) values ($1, $2) returning id, name, slug', [input.name, slug]);
    revalidate(['brands']);
    res.status(201).json(rows[0]);
  });

  r.put('/brands/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const input = brandInputSchema.parse(req.body);
    const slug = await uniqueSlug(db, 'brands', input.slug || input.name, id);
    const { rowCount } = await db.query('update brands set name = $2, slug = $3 where id = $1', [id, input.name, slug]);
    if (!rowCount) throw notFound('Merek');
    revalidate(['brands', 'products']);
    res.json({ id, slug });
  });

  r.delete('/brands/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { rowCount } = await db.query('delete from brands where id = $1', [id]);
    if (!rowCount) throw notFound('Merek');
    revalidate(['brands', 'products']);
    res.status(204).end();
  });

  // ---------------------------------------------------------------- banner promo
  r.get('/banners', async (_req, res) => {
    res.json(await listBanners(db, { activeOnly: false }));
  });

  r.post('/banners', async (req, res) => {
    const b = bannerInputSchema.parse(req.body);
    const { rows } = await db.query<{ id: string }>(
      `insert into promo_banners (title, subtitle, image_url, link_url, theme, sort_order, is_active, starts_at, ends_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
      [b.title, b.subtitle, b.imageUrl, b.linkUrl, b.theme, b.sortOrder, b.isActive, b.startsAt, b.endsAt],
    );
    revalidate(['banners']);
    res.status(201).json(rows[0]);
  });

  r.put('/banners/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const b = bannerInputSchema.parse(req.body);
    const { rowCount } = await db.query(
      `update promo_banners set title = $2, subtitle = $3, image_url = $4, link_url = $5, theme = $6, sort_order = $7,
              is_active = $8, starts_at = $9, ends_at = $10 where id = $1`,
      [id, b.title, b.subtitle, b.imageUrl, b.linkUrl, b.theme, b.sortOrder, b.isActive, b.startsAt, b.endsAt],
    );
    if (!rowCount) throw notFound('Banner');
    revalidate(['banners']);
    res.json({ id });
  });

  r.delete('/banners/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { rowCount } = await db.query('delete from promo_banners where id = $1', [id]);
    if (!rowCount) throw notFound('Banner');
    revalidate(['banners']);
    res.status(204).end();
  });

  // ---------------------------------------------------------------- pesanan
  r.get('/orders', async (req, res) => {
    const q = z
      .object({ status: orderStatusSchema.optional(), q: z.string().trim().max(60).optional(), page })
      .parse(req.query);
    const result = await listOrders(db, { ...q, pageSize: 30 });
    res.json({ ...result, page: q.page, pageSize: 30 });
  });

  r.get('/orders/counts', async (_req, res) => {
    const { rows } = await db.query<{ status: string; n: number }>(
      `select status, count(*)::int as n from orders where created_at > now() - interval '30 days' group by status`,
    );
    res.json(Object.fromEntries(rows.map((r) => [r.status, r.n])));
  });

  r.patch('/orders/:id', async (req, res) => {
    const { id } = idParam.parse(req.params);
    const { status } = orderStatusInputSchema.parse(req.body);
    await setOrderStatus(db, id, status);
    res.json({ id, status });
  });

  // ---------------------------------------------------------------- toko
  r.get('/store', async (_req, res) => {
    res.json(await getStore(db));
  });

  r.put('/store', ownerOnly, async (req, res) => {
    const s = storeInputSchema.parse(req.body);
    await db.query(
      `update store_settings set name = $1, address = $2, lat = $3, lng = $4, maps_url = $5, phone = $6,
              whatsapp = $7, opening_hours = $8 where id = 1`,
      [s.name, s.address, s.lat, s.lng, s.mapsUrl, s.phone, s.whatsapp, JSON.stringify(s.openingHours)],
    );
    revalidate(['store']);
    res.json(await getStore(db));
  });

  // ---------------------------------------------------------------- import/export
  r.get('/import/template', (_req, res) => {
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="template-barang-new-agung.csv"');
    res.send(templateCsv());
  });

  r.post('/import', ownerOnly, sheets.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Pilih file .csv atau .xlsx');
    const rows = await parseSheet(req.file.buffer, req.file.originalname);
    const result = await importRows(db, rows, req.staff!.userId);
    revalidate(['products', 'categories', 'brands']);
    res.json(result);
  });

  r.get('/export', async (_req, res) => {
    const date = new Date().toISOString().slice(0, 10);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="barang-new-agung-${date}.csv"`);
    res.send(await exportRows(db));
  });

  r.get('/search-misses', async (_req, res) => {
    const { rows } = await db.query(
      `select query, count(*)::int as count, max(created_at) as "lastAt"
         from search_misses where created_at > now() - interval '30 days'
        group by query order by count desc, "lastAt" desc limit 50`,
    );
    res.json(rows);
  });

  // ---------------------------------------------------------------- pegawai
  r.get('/staff', ownerOnly, async (_req, res) => {
    const { rows } = await db.query(
      `select user_id as "userId", email, role, active from staff order by role, email`,
    );
    res.json(rows);
  });

  r.post('/staff', ownerOnly, async (req, res) => {
    const input = staffInviteSchema.parse(req.body);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(501, 'Undangan pegawai butuh Supabase (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY)');
    }
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: (env.SITE_URL || env.WEB_URL) ? `${(env.SITE_URL || env.WEB_URL).replace(/\/$/, '')}/panel/atur-sandi` : undefined,
    });
    if (error || !data.user) throw new HttpError(502, `Gagal mengirim undangan: ${error?.message ?? 'tanpa user'}`);
    await db.query(
      `insert into staff (user_id, email, role) values ($1, $2, $3)
       on conflict (user_id) do update set role = excluded.role, active = true`,
      [data.user.id, input.email.toLowerCase(), input.role],
    );
    res.status(201).json({ userId: data.user.id, email: input.email, role: input.role, active: true });
  });

  r.patch('/staff/:id', ownerOnly, async (req, res) => {
    const { id } = idParam.parse(req.params);
    const input = staffUpdateSchema.parse(req.body);
    if (id === req.staff!.userId) throw new HttpError(400, 'Tidak bisa mengubah akses akun sendiri');
    const { rowCount } = await db.query(
      `update staff set role = coalesce($2, role), active = coalesce($3, active) where user_id = $1`,
      [id, input.role ?? null, input.active ?? null],
    );
    if (!rowCount) throw notFound('Pegawai');
    res.json({ ok: true });
  });

  return r;
}
