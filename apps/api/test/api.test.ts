import { execFileSync } from 'node:child_process';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createPool, type Db } from '../src/db';
import { loadEnv } from '../src/env';

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/newagung_test';
const root = path.resolve(__dirname, '../../..');

let db: Db;
let app: ReturnType<typeof createApp>;
const revalidated: string[][] = [];
const auth = { Authorization: 'Bearer test-owner' };

beforeAll(() => {
  execFileSync('bash', [path.join(root, 'supabase/local/reset.sh')], {
    env: { ...process.env, DATABASE_URL: TEST_DB },
    stdio: 'ignore',
  });
  const env = loadEnv({ NODE_ENV: 'test', DATABASE_URL: TEST_DB, DEV_AUTH_TOKEN: 'test-owner' } as NodeJS.ProcessEnv);
  db = createPool(TEST_DB);
  app = createApp({
    db,
    env,
    revalidate: (tags) => revalidated.push(tags),
    storeImage: async () => 'https://example.test/foto.webp',
  });
});

afterAll(async () => {
  await db?.end();
});

describe('katalog publik', () => {
  it('mengembalikan info toko dengan status buka', async () => {
    const res = await request(app).get('/api/store').expect(200);
    expect(res.body.whatsapp).toBe('6282348485101');
    expect(res.body.timezone).toBe('Asia/Makassar');
    expect(res.body.status.label).toMatch(/^(Buka · tutup 22\.00|Tutup · buka 05\.00)$/);
  });

  it('mengembalikan pohon kategori dengan jumlah barang', async () => {
    const res = await request(app).get('/api/categories').expect(200);
    const pulpen = res.body.find((c: { slug: string }) => c.slug === 'pulpen-pensil');
    expect(pulpen.children.map((c: { slug: string }) => c.slug)).toContain('pensil-mekanik');
    expect(pulpen.productCount).toBe(
      pulpen.children.reduce((s: number, c: { productCount: number }) => s + c.productCount, 0),
    );
  });

  it('memfilter barang per kategori induk (termasuk sub-kategori)', async () => {
    const res = await request(app).get('/api/products?category=pulpen-pensil&sort=termurah').expect(200);
    expect(res.body.total).toBeGreaterThan(3);
    const prices = res.body.items.map((p: { price: number }) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('menampilkan warna varian dan quickAdd hanya untuk barang 1 varian', async () => {
    const res = await request(app).get('/api/products?q=energel').expect(200);
    const energel = res.body.items[0];
    expect(energel.colors.map((c: { label: string }) => c.label)).toEqual(['Hitam', 'Biru', 'Merah']);
    expect(energel.quickAdd).toBeNull();
    const casio = (await request(app).get('/api/products?q=fx-991').expect(200)).body.items[0];
    expect(casio.quickAdd).toMatchObject({ unit: 'pcs', price: 310000 });
  });

  it('mencari dengan sinonim, salah ketik, dan beberapa kata', async () => {
    const tipex = await request(app).get('/api/search?q=tipex').expect(200);
    expect(tipex.body.items.map((p: { slug: string }) => p.slug)).toEqual(
      expect.arrayContaining(['kenko-correction-tape', 'joyko-correction-pen']),
    );
    const typo = await request(app).get('/api/search?q=pentl').expect(200);
    expect(typo.body.items.some((p: { brand: string }) => p.brand === 'Pentel')).toBe(true);
    const multi = await request(app).get('/api/search?q=spidol%20snowman').expect(200);
    expect(multi.body.items.every((p: { brand: string }) => p.brand === 'Snowman')).toBe(true);
    expect(multi.body.total).toBeGreaterThan(0);
  });

  it('mencatat kata kunci yang tidak ditemukan', async () => {
    await request(app).get('/api/search?q=kertas%20karbon%20xyz').expect(200);
    const { rows } = await db.query(`select 1 from search_misses where query = 'kertas karbon xyz'`);
    expect(rows).toHaveLength(1);
  });

  it('memberi saran pencarian', async () => {
    const res = await request(app).get('/api/search/suggest?q=cas').expect(200);
    expect(res.body[0]).toMatchObject({ type: 'brand', label: 'Casio' });
    expect(res.body.length).toBeLessThanOrEqual(6);
  });

  it('mengembalikan detail barang dengan varian dan harga bertingkat', async () => {
    const res = await request(app).get('/api/products/kertas-sidu-a4-70').expect(200);
    expect(res.body.category).toMatchObject({ slug: 'kertas' });
    expect(res.body.variants[0].prices.map((p: { unit: string }) => p.unit)).toEqual(['rim', 'box']);
    await request(app).get('/api/products/tidak-ada').expect(404);
  });
});

describe('pesanan', () => {
  async function variant(slug: string, idx = 0) {
    const res = await request(app).get(`/api/products/${slug}`).expect(200);
    return res.body.variants[idx];
  }

  it('membuat pesanan dengan harga dari server dan link WhatsApp', async () => {
    const kertas = await variant('kertas-sidu-a4-70');
    const buku = await variant('buku-tulis-sidu', 1);
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Rina',
        fulfilment: 'ambil',
        pickupNote: 'jam 16.00',
        items: [
          { variantId: kertas.id, unit: 'rim', qty: 2 },
          { variantId: buku.id, unit: 'pcs', qty: 4 },
          { variantId: buku.id, unit: 'pcs', qty: 6 },
        ],
      })
      .expect(201);
    expect(res.body.code).toMatch(/^NA-\d{6}-\d{3}$/);
    expect(res.body.total).toBe(2 * 52000 + 10 * 5500);
    expect(res.body.waUrl).toMatch(/^https:\/\/wa\.me\/6282348485101\?text=/);
    const text = decodeURIComponent(res.body.waUrl.split('?text=')[1]);
    expect(text).toContain('Buku Tulis SiDU (58 lembar) — 10 pcs × Rp5.500');
    expect(text).toContain(`Kode pesanan: ${res.body.code}`);
    const { rows } = await db.query('select count(*)::int as n from order_items i join orders o on o.id = i.order_id where o.code = $1', [res.body.code]);
    expect(rows[0].n).toBe(2);
  });

  it('menolak barang habis dan satuan yang tidak dijual', async () => {
    const isi = await request(app).get('/api/products/isi-pensil-pentel').expect(200);
    const habis = isi.body.variants.find((v: { stockStatus: string }) => v.stockStatus === 'habis');
    const res = await request(app)
      .post('/api/orders')
      .send({ customerName: 'A', fulfilment: 'antar', items: [{ variantId: habis.id, unit: 'tabung', qty: 1 }, { variantId: habis.id, unit: 'box', qty: 1 }] })
      .expect(409);
    expect(res.body.details.problems.map((p: { reason: string }) => p.reason).sort()).toEqual(['habis', 'tidak-ada']);
  });

  it('menolak honeypot dan data tidak valid', async () => {
    const kertas = await variant('kertas-sidu-a4-70');
    await request(app)
      .post('/api/orders')
      .send({ customerName: 'Bot', fulfilment: 'ambil', items: [{ variantId: kertas.id, unit: 'rim', qty: 1 }], website: 'spam' })
      .expect(400);
    await request(app).post('/api/orders').send({ customerName: '', fulfilment: 'ambil', items: [] }).expect(400);
  });

  it('memberi harga terbaru untuk pesan ulang', async () => {
    const kertas = await variant('kertas-sidu-a4-70');
    const res = await request(app)
      .post('/api/variants/prices')
      .send({ items: [{ variantId: kertas.id, unit: 'rim' }, { variantId: kertas.id, unit: 'lusin' }] })
      .expect(200);
    expect(res.body[0]).toMatchObject({ price: 52000, stockStatus: 'ada' });
    expect(res.body[1].price).toBeNull();
  });
});

describe('panel', () => {
  it('menolak tanpa login', async () => {
    await request(app).get('/api/admin/me').expect(401);
    await request(app).get('/api/admin/me').set('Authorization', 'Bearer salah').expect(401);
    const me = await request(app).get('/api/admin/me').set(auth).expect(200);
    expect(me.body.role).toBe('owner');
  });

  let productId = '';

  it('membuat, mengubah, dan menghapus barang', async () => {
    const cats = (await request(app).get('/api/admin/categories').set(auth)).body;
    const lem = cats.find((c: { slug: string }) => c.slug === 'crayon-cat-lem').children.find((c: { slug: string }) => c.slug === 'lem');
    const created = await request(app)
      .post('/api/admin/products')
      .set(auth)
      .send({
        name: 'Lem Kertas UHU 21 ml',
        categoryId: lem.id,
        brandId: null,
        images: ['https://example.test/uhu.webp'],
        variants: [{ label: '', prices: [{ unit: 'pcs', qtyPerUnit: 1, price: 9000 }, { unit: 'lusin', qtyPerUnit: 12, price: 100000 }] }],
      })
      .expect(201);
    productId = created.body.id;
    expect(created.body.slug).toBe('lem-kertas-uhu-21-ml');
    expect(revalidated.at(-1)).toContain('products');

    const search = await request(app).get('/api/search?q=uhu').expect(200);
    expect(search.body.items[0].image).toBe('https://example.test/uhu.webp');

    const detail = (await request(app).get(`/api/admin/products/${productId}`).set(auth)).body;
    await request(app)
      .put(`/api/admin/products/${productId}`)
      .set(auth)
      .send({
        name: 'Lem Kertas UHU 21 ml',
        categoryId: lem.id,
        brandId: null,
        variants: [
          { id: detail.variants[0].id, label: '21 ml', prices: [{ unit: 'pcs', qtyPerUnit: 1, price: 9500 }] },
          { label: '40 ml', prices: [{ unit: 'pcs', qtyPerUnit: 1, price: 16000 }] },
        ],
      })
      .expect(200);
    const after = (await request(app).get('/api/products/lem-kertas-uhu-21-ml').expect(200)).body;
    expect(after.variants.map((v: { label: string }) => v.label)).toEqual(['21 ml', '40 ml']);
    expect(after.variants[0].prices).toEqual([expect.objectContaining({ unit: 'pcs', price: 9500 })]);
    expect(after.images).toEqual([]);

    const { rows } = await db.query('select old_price, new_price from price_history h join variant_prices vp on vp.id = h.variant_price_id where vp.variant_id = $1', [detail.variants[0].id]);
    expect(rows).toEqual([{ old_price: 9000, new_price: 9500 }]);
  });

  it('mengubah harga cepat dan massal per merek', async () => {
    const rows = (await request(app).get('/api/admin/prices?q=casio').set(auth).expect(200)).body.items;
    const fx = rows.find((r: { productName: string }) => r.productName.includes('fx-991'));
    await request(app).patch(`/api/admin/prices/${fx.variantPriceId}`).set(auth).send({ price: 315000 }).expect(200);

    const brands = (await request(app).get('/api/admin/brands').set(auth)).body;
    const casio = brands.find((b: { slug: string }) => b.slug === 'casio');
    const bulk = await request(app).post('/api/admin/prices/bulk').set(auth).send({ brandId: casio.id, percent: 10, roundTo: 1000 }).expect(200);
    expect(bulk.body.updated).toBe(2);
    const p = (await request(app).get('/api/products/casio-fx-991id-plus')).body;
    expect(p.variants[0].prices[0].price).toBe(347000); // 315000 × 1.1 = 346500 → 347000
  });

  it('mengelola status pesanan', async () => {
    const list = (await request(app).get('/api/admin/orders').set(auth).expect(200)).body;
    expect(list.total).toBeGreaterThan(0);
    const id = list.items[0].id;
    await request(app).patch(`/api/admin/orders/${id}`).set(auth).send({ status: 'disiapkan' }).expect(200);
    const filtered = (await request(app).get('/api/admin/orders?status=disiapkan').set(auth)).body;
    expect(filtered.items.map((o: { id: string }) => o.id)).toContain(id);
  });

  it('import CSV menambah dan memperbarui barang', async () => {
    const csv = [
      'kategori,merek,nama,varian,warna,sku,satuan,isi,harga,stok,deskripsi',
      'Lem,Fox,Lem Fox PVAc,150 g,,,pcs,1,"Rp12.000",ada,',
      'Penggaris,Butterfly,Penggaris Besi 30 cm,,,,pcs,1,15000,ada,Penggaris stainless',
      'Penggaris,Butterfly,Penggaris Besi 30 cm,,,,lusin,12,170000,ada,',
      ',,,,,,,,,,',
      ',,Tanpa Harga,,,,pcs,1,,ada,',
    ].join('\n');
    const res = await request(app)
      .post('/api/admin/import')
      .set(auth)
      .attach('file', Buffer.from(csv), 'barang.csv')
      .expect(200);
    expect(res.body).toMatchObject({ products: 2, created: 1, updated: 1, prices: 3 });
    expect(res.body.errors).toEqual([{ row: 6, message: 'Kolom "harga" kosong atau bukan angka' }]);
    const fox = (await request(app).get('/api/products/lem-fox')).body;
    expect(fox.variants.find((v: { label: string }) => v.label === '150 g').prices[0].price).toBe(12000);
    expect(fox.variants).toHaveLength(2); // varian 1 kg tidak dihapus
    const ruler = (await request(app).get('/api/products/penggaris-besi-30-cm').expect(200)).body;
    expect(ruler.category.name).toBe('Penggaris');

    const exported = await request(app).get('/api/admin/export').set(auth).expect(200);
    expect(exported.text).toContain('Penggaris Besi 30 cm');
  });

  it('menghapus barang (owner)', async () => {
    await request(app).delete(`/api/admin/products/${productId}`).set(auth).expect(204);
    await request(app).get('/api/products/lem-kertas-uhu-21-ml').expect(404);
  });

  it('mengubah jam buka dan menolak format salah', async () => {
    const store = (await request(app).get('/api/admin/store').set(auth)).body;
    await request(app).put('/api/admin/store').set(auth).send({ ...store, whatsapp: '082348485101' }).expect(400);
    const updated = await request(app)
      .put('/api/admin/store')
      .set(auth)
      .send({ ...store, openingHours: { ...store.openingHours, sun: null } })
      .expect(200);
    expect(updated.body.openingHours.sun).toBeNull();
  });
});
