import {
  buildOrderMessage,
  orderTotal,
  waLink,
  type CurrentPrice,
  type OrderInput,
  type OrderStatus,
  type OrderView,
  type StockStatus,
} from '@newagung/shared';
import { withTx, type Db, type Queryable } from '../db';
import { HttpError } from '../errors';
import { getStore } from './store';

interface PriceRow {
  variant_id: string;
  unit: string;
  price: number | null;
  stock_status: StockStatus;
  product_name: string;
  label: string;
  is_active: boolean;
}

async function lookupPrices(db: Queryable, items: { variantId: string; unit: string }[]): Promise<PriceRow[]> {
  const { rows } = await db.query<PriceRow>(
    `select v.id as variant_id, req.unit, vp.price, v.stock_status, p.name as product_name, v.label, p.is_active
       from unnest($1::uuid[], $2::text[]) as req(variant_id, unit)
       join product_variants v on v.id = req.variant_id
       join products p on p.id = v.product_id
       left join variant_prices vp on vp.variant_id = v.id and vp.unit = req.unit`,
    [items.map((i) => i.variantId), items.map((i) => i.unit)],
  );
  return rows;
}

export function lineName(productName: string, label: string): string {
  return label ? `${productName} (${label})` : productName;
}

/** Harga terbaru untuk fitur "pesan ulang" */
export async function currentPrices(db: Queryable, items: { variantId: string; unit: string }[]): Promise<CurrentPrice[]> {
  const rows = await lookupPrices(db, items);
  const key = (v: string, u: string) => `${v}|${u}`;
  const map = new Map(rows.map((r) => [key(r.variant_id, r.unit), r]));
  return items.map((i) => {
    const r = map.get(key(i.variantId, i.unit));
    return {
      variantId: i.variantId,
      unit: i.unit,
      price: r && r.is_active ? r.price : null,
      stockStatus: r && r.is_active ? r.stock_status : null,
      name: r ? lineName(r.product_name, r.label) : null,
    };
  });
}

export interface CreatedOrder {
  code: string;
  total: number;
  waUrl: string;
  message: string;
  items: { variantId: string; name: string; unit: string; qty: number; price: number }[];
}

export async function createOrder(db: Db, input: OrderInput): Promise<CreatedOrder> {
  // gabungkan baris ganda (varian + satuan yang sama)
  const merged = new Map<string, { variantId: string; unit: string; qty: number }>();
  for (const it of input.items) {
    const k = `${it.variantId}|${it.unit}`;
    const prev = merged.get(k);
    merged.set(k, { ...it, qty: (prev?.qty ?? 0) + it.qty });
  }
  const items = [...merged.values()];

  const rows = await lookupPrices(db, items);
  const byKey = new Map(rows.map((r) => [`${r.variant_id}|${r.unit}`, r]));

  const problems: { variantId: string; unit: string; reason: 'tidak-ada' | 'habis' }[] = [];
  const lines = items.flatMap((it) => {
    const r = byKey.get(`${it.variantId}|${it.unit}`);
    if (!r || !r.is_active || r.price === null) {
      problems.push({ variantId: it.variantId, unit: it.unit, reason: 'tidak-ada' });
      return [];
    }
    if (r.stock_status === 'habis') {
      problems.push({ variantId: it.variantId, unit: it.unit, reason: 'habis' });
      return [];
    }
    return [{ variantId: it.variantId, name: lineName(r.product_name, r.label), unit: it.unit, qty: it.qty, price: r.price }];
  });
  if (problems.length) {
    throw new HttpError(409, 'Beberapa produk sudah tidak tersedia. Mohon periksa kembali daftar pesanan Anda.', { problems });
  }

  const store = await getStore(db);
  const total = orderTotal(lines);

  const code = await withTx(db, async (c) => {
    const { rows: codeRows } = await c.query<{ code: string }>('select next_order_code($1) as code', [store.timezone]);
    const code = codeRows[0]!.code;
    const { rows: orderRows } = await c.query<{ id: string }>(
      `insert into orders (code, customer_name, fulfilment, pickup_note, estimated_total)
       values ($1, $2, $3, $4, $5) returning id`,
      [code, input.customerName, input.fulfilment, input.pickupNote, total],
    );
    const orderId = orderRows[0]!.id;
    await c.query(
      `insert into order_items (order_id, variant_id, name_snapshot, unit_snapshot, price_snapshot, qty)
       select $1, * from unnest($2::uuid[], $3::text[], $4::text[], $5::int[], $6::int[])`,
      [
        orderId,
        lines.map((l) => l.variantId),
        lines.map((l) => l.name),
        lines.map((l) => l.unit),
        lines.map((l) => l.price),
        lines.map((l) => l.qty),
      ],
    );
    return code;
  });

  const message = buildOrderMessage({
    storeName: store.name,
    code,
    customerName: input.customerName,
    fulfilment: input.fulfilment,
    pickupNote: input.pickupNote,
    lines,
  });

  return { code, total, waUrl: waLink(store.whatsapp, message), message, items: lines };
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export async function listOrders(
  db: Queryable,
  opts: { status?: OrderStatus; page: number; pageSize: number; q?: string },
): Promise<{ items: OrderView[]; total: number }> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.status) {
    params.push(opts.status);
    where.push(`o.status = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q.toLowerCase()}%`);
    where.push(`(lower(o.code) like $${params.length} or lower(o.customer_name) like $${params.length})`);
  }
  params.push(opts.pageSize, (opts.page - 1) * opts.pageSize);
  const { rows } = await db.query<OrderView & { total: number }>(
    `select o.id, o.code, o.customer_name as "customerName", o.fulfilment, o.pickup_note as "pickupNote",
            o.status, o.estimated_total as "estimatedTotal", o.created_at as "createdAt",
            coalesce((select json_agg(json_build_object('variantId', i.variant_id, 'name', i.name_snapshot,
                       'unit', i.unit_snapshot, 'price', i.price_snapshot, 'qty', i.qty) order by i.name_snapshot)
                      from order_items i where i.order_id = o.id), '[]') as items,
            count(*) over()::int as total
       from orders o
       ${where.length ? `where ${where.join(' and ')}` : ''}
      order by o.created_at desc
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return {
    items: rows.map(({ total: _t, ...o }) => ({ ...o, createdAt: new Date(o.createdAt).toISOString() })),
    total: rows[0]?.total ?? 0,
  };
}

export async function setOrderStatus(db: Queryable, id: string, status: OrderStatus): Promise<void> {
  const { rowCount } = await db.query('update orders set status = $2 where id = $1', [id, status]);
  if (!rowCount) throw new HttpError(404, 'Pesanan tidak ditemukan');
}
