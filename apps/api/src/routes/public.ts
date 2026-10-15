import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { currentPricesInputSchema, getOpenStatus, orderInputSchema, productListQuerySchema } from '@newagung/shared';
import type { Ctx } from '../app';
import { notFound, HttpError } from '../errors';
import { getProduct, listBanners, listBrands, listCategories, listProducts, productSummariesByIds, recordSearchMiss, suggest } from '../lib/catalog';
import { createDanaPayment, danaEnabled, parseDanaNotify, queryDanaPayment, type PaymentStatus } from '../lib/dana';
import { createOrder, currentPrices, getOrderByCode } from '../lib/orders';
import { fetchShippingRates, reverseGeocode } from '../lib/shipping';
import { getStore } from '../lib/store';

export function publicRoutes({ db, env }: Ctx): Router {
  const r = Router();

  r.use((req, res, next) => {
    if (req.method === 'GET') res.set('Cache-Control', 'no-cache');
    next();
  });

  r.get('/health', async (_req, res) => {
    await db.query('select 1');
    // devLogin: apakah panel menerima DEV_AUTH_TOKEN (hanya mode lokal tanpa Supabase)
    res.json({ ok: true, devLogin: Boolean(env.DEV_AUTH_TOKEN) });
  });

  r.get('/store', async (_req, res) => {
    const store = await getStore(db);
    res.json({ ...store, status: getOpenStatus(store.openingHours, store.timezone) });
  });

  r.get('/categories', async (_req, res) => {
    res.json(await listCategories(db));
  });

  r.get('/banners', async (_req, res) => {
    res.json(await listBanners(db, { activeOnly: true }));
  });

  r.get('/brands', async (_req, res) => {
    res.json(await listBrands(db));
  });

  r.get('/products', async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    res.json(await listProducts(db, query));
  });

  r.get('/products/by-ids', async (req, res) => {
    const ids = z
      .string()
      .default('')
      .transform((s) => s.split(',').filter(Boolean))
      .pipe(z.array(z.uuid()).max(100))
      .parse(req.query.ids);
    res.json(await productSummariesByIds(db, ids));
  });

  r.get('/products/:slug', async (req, res) => {
    const product = await getProduct(db, { slug: req.params.slug });
    if (!product) throw notFound('Produk');
    res.json(product);
  });

  r.get('/search', async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    if (!query.q) throw new HttpError(400, 'Mohon isi kata kunci pencarian');
    const result = await listProducts(db, query);
    if (result.total === 0 && query.page === 1) await recordSearchMiss(db, query.q);
    res.json(result);
  });

  r.get('/search/suggest', async (req, res) => {
    const q = z.string().max(100).default('').parse(req.query.q);
    res.json(await suggest(db, q));
  });

  const orderLimiter = rateLimit({
    windowMs: 60_000,
    limit: env.NODE_ENV === 'test' ? 1000 : 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Terlalu banyak pesanan dalam waktu singkat. Mohon tunggu sebentar, lalu coba kembali.' },
  });

  r.post('/orders', orderLimiter, async (req, res) => {
    const input = orderInputSchema.parse(req.body);
    if (input.website) throw new HttpError(400, 'Data pesanan tidak valid');
    if (input.paymentMethod === 'dana' && !danaEnabled(env)) throw new HttpError(503, 'Pembayaran DANA belum diaktifkan oleh toko');
    const order = await createOrder(db, input);
    if (input.paymentMethod !== 'dana') return res.status(201).json(order);
    try {
      const pay = await createDanaPayment(env, order);
      await db.query('update orders set payment_ref = $2 where code = $1', [order.code, pay.ref]);
      res.status(201).json({ ...order, payUrl: pay.payUrl });
    } catch (err) {
      await db.query(`update orders set payment_status = 'failed', status = 'batal' where code = $1`, [order.code]);
      throw err instanceof HttpError ? err : new HttpError(502, 'Halaman bayar DANA belum bisa dibuka. Silakan coba lagi atau pilih pesan via WhatsApp.');
    }
  });

  r.get('/payments/config', (_req, res) => {
    res.json({ dana: danaEnabled(env), sandbox: env.DANA_ENV === 'sandbox' });
  });

  r.post('/shipping/rates', async (req, res) => {
    const schema = z.object({
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
      totalWeightGram: z.number().int().min(1).optional(),
      totalValue: z.number().int().min(0).optional(),
    });
    const parsed = schema.parse(req.body);
    const store = await getStore(db);
    const rates = await fetchShippingRates(env, store, parsed);
    res.json({ rates });
  });

  r.get('/shipping/reverse-geocode', async (req, res) => {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
    });
    const { lat, lng } = schema.parse(req.query);
    const result = await reverseGeocode(lat, lng);
    res.json(result);
  });

  async function savePayment(code: string, status: PaymentStatus) {
    // lunas = pesanan masuk antrean toko; kedaluwarsa/gagal = batal
    await db.query(
      `update orders set payment_status = $2,
              paid_at = case when $2 = 'paid' then coalesce(paid_at, now()) else paid_at end,
              status = case when $2 in ('expired', 'failed') and status = 'baru' then 'batal' else status end
        where code = $1 and payment_method = 'dana' and payment_status <> 'paid'`,
      [code, status],
    );
  }

  /** Status bayar untuk halaman /bayar/:code. Tanya DANA bila masih menunggu (webhook bisa telat). */
  r.get('/payments/:code', async (req, res) => {
    const code = z.string().max(40).parse(req.params.code);
    const { rows } = await db.query<{ code: string; total: number; status: string; payment_status: PaymentStatus; payment_method: string }>(
      'select code, estimated_total as total, status, payment_status, payment_method from orders where code = $1',
      [code],
    );
    const o = rows[0];
    if (!o) throw notFound('Pesanan');
    if (o.payment_method === 'dana' && o.payment_status === 'pending' && danaEnabled(env)) {
      try {
        const s = await queryDanaPayment(env, code);
        if (s !== 'pending') {
          await savePayment(code, s);
          o.payment_status = s;
        }
      } catch {
        // DANA sibuk: tampilkan status terakhir
      }
    }
    res.json({ code: o.code, total: o.total, status: o.status, paymentStatus: o.payment_status });
  });

  /** Webhook DANA (finishNotify). Tanda tangan wajib valid. */
  r.post('/payments/dana/notify', async (req, res) => {
    const raw = (req as typeof req & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
    let n;
    try {
      n = parseDanaNotify(env, req.originalUrl, req.headers as Record<string, string>, raw);
    } catch {
      return res.status(401).json({ responseCode: '4015600', responseMessage: 'Unauthorized. Invalid Signature' });
    }
    await savePayment(n.code, n.status);
    res.json({ responseCode: '2005600', responseMessage: 'Successful' });
  });

  r.post('/variants/prices', async (req, res) => {
    const { items } = currentPricesInputSchema.parse(req.body);
    res.json(await currentPrices(db, items));
  });

  r.post('/orders/statuses', async (req, res) => {
    const { codes } = z.object({ codes: z.array(z.string().max(40)).max(100) }).parse(req.body);
    if (!codes.length) return res.json({});
    const { rows } = await db.query<{ code: string; status: string }>(
      'select code, status from orders where code = any($1::text[])',
      [codes],
    );
    const map: Record<string, string> = {};
    for (const r of rows) map[r.code] = r.status;
    res.json(map);
  });

  r.get('/orders/:code', async (req, res) => {
    const code = z.string().max(40).parse(req.params.code);
    const order = await getOrderByCode(db, code);
    if (!order) throw notFound('Pesanan');
    res.json(order);
  });

  return r;
}
