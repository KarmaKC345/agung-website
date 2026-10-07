import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { currentPricesInputSchema, getOpenStatus, orderInputSchema, productListQuerySchema } from '@newagung/shared';
import type { Ctx } from '../app';
import { notFound, HttpError } from '../errors';
import { getProduct, listBrands, listCategories, listProducts, productSummariesByIds, recordSearchMiss, suggest } from '../lib/catalog';
import { createOrder, currentPrices } from '../lib/orders';
import { getStore } from '../lib/store';

export function publicRoutes({ db, env }: Ctx): Router {
  const r = Router();

  r.use((req, res, next) => {
    if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
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
    if (!product) throw notFound('Barang');
    res.json(product);
  });

  r.get('/search', async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    if (!query.q) throw new HttpError(400, 'Kata kunci kosong');
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
    message: { error: 'Terlalu banyak pesanan dalam waktu singkat. Coba lagi sebentar.' },
  });

  r.post('/orders', orderLimiter, async (req, res) => {
    const input = orderInputSchema.parse(req.body);
    if (input.website) throw new HttpError(400, 'Data tidak valid');
    res.status(201).json(await createOrder(db, input));
  });

  r.post('/variants/prices', async (req, res) => {
    const { items } = currentPricesInputSchema.parse(req.body);
    res.json(await currentPrices(db, items));
  });

  return r;
}
