'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatRupiah, ORDER_STATUS_LABEL, type OrderStatus, type OrderView } from '@newagung/shared';
import { btnSecondary, inputCls, PageTitle } from '@/components/panel/PanelShell';
import { adminFetch } from '@/lib/admin';

const FLOW: OrderStatus[] = ['baru', 'disiapkan', 'siap', 'selesai'];
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  baru: 'Mulai siapkan',
  disiapkan: 'Tandai siap',
  siap: 'Tandai selesai',
};
const STATUS_STYLE: Record<OrderStatus, string> = {
  baru: 'bg-accent text-accent-ink',
  disiapkan: 'bg-warn text-white',
  siap: 'bg-brand text-white',
  selesai: 'bg-sunken text-muted',
  batal: 'bg-sunken text-muted line-through',
};
const timeFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: OrderView[]; total: number; pageSize: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ page: String(page) });
    if (status) sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    try {
      const [list, c] = await Promise.all([
        adminFetch<{ items: OrderView[]; total: number; pageSize: number }>(`/orders?${sp}`),
        adminFetch<Record<string, number>>('/orders/counts'),
      ]);
      setData(list);
      setCounts(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat');
    }
  }, [page, status, q]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 30_000); // pesanan baru muncul tanpa perlu muat ulang
    return () => clearInterval(id);
  }, [load]);

  async function update(id: string, s: OrderStatus) {
    await adminFetch(`/orders/${id}`, { method: 'PATCH', json: { status: s } });
    await load();
  }

  return (
    <>
      <PageTitle>Pesanan masuk</PageTitle>
      <div className="flex flex-wrap items-center gap-2">
        {(['', ...FLOW, 'batal'] as (OrderStatus | '')[]).map((s) => (
          <button
            key={s || 'semua'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            aria-pressed={status === s}
            className="h-9 rounded-full border border-line-strong bg-surface px-3.5 text-[14px] font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-surface"
          >
            {s ? ORDER_STATUS_LABEL[s] : 'Semua'}
            {s && counts[s] ? <span className="ml-1.5 tabular-nums opacity-70">{counts[s]}</span> : null}
          </button>
        ))}
        <input
          type="search"
          placeholder="Cari kode / nama"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          className={`${inputCls} ml-auto max-w-56`}
        />
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}
      {!data ? (
        <p className="mt-6 text-muted">Memuat…</p>
      ) : data.items.length === 0 ? (
        <p className="mt-6 rounded-tag border border-dashed border-line-strong bg-surface p-6 text-center text-muted">
          Belum ada pesanan{status ? ` berstatus “${ORDER_STATUS_LABEL[status]}”` : ''}. Pesanan dari tombol WhatsApp di website muncul di sini.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {data.items.map((o) => (
            <li key={o.id} className="rounded-tag border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[16px] font-medium">{o.code}</span>
                <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${STATUS_STYLE[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                <span className="ml-auto text-[13px] text-muted">{timeFmt.format(new Date(o.createdAt))}</span>
              </div>
              <p className="mt-2 text-[15px]">
                <b>{o.customerName}</b> · {o.fulfilment === 'ambil' ? 'Ambil di toko' : 'Minta diantar'}
                {o.pickupNote && <span className="text-muted"> · {o.pickupNote}</span>}
              </p>
              <ul className="mt-3 space-y-1 text-[14px]">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      <b className="tabular-nums">
                        {it.qty} {it.unit}
                      </b>{' '}
                      {it.name}
                    </span>
                    <span className="shrink-0 text-muted tabular-nums">{formatRupiah(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <hr className="receipt-rule my-3" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px]">
                  Total <b className="tabular-nums">{formatRupiah(o.estimatedTotal)}</b>
                </span>
                <div className="ml-auto flex gap-2">
                  {NEXT_LABEL[o.status] && (
                    <button className={btnSecondary} onClick={() => update(o.id, FLOW[FLOW.indexOf(o.status) + 1]!)}>
                      {NEXT_LABEL[o.status]}
                    </button>
                  )}
                  {o.status !== 'batal' && o.status !== 'selesai' && (
                    <button
                      className="h-10 px-2 text-[13px] text-muted underline underline-offset-4 hover:text-danger"
                      onClick={() => confirm(`Batalkan pesanan ${o.code}?`) && update(o.id, 'batal')}
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.total > data.pageSize && (
        <div className="mt-6 flex items-center gap-3">
          <button className={btnSecondary} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Sebelumnya
          </button>
          <span className="text-muted tabular-nums">
            {page} / {Math.ceil(data.total / data.pageSize)}
          </span>
          <button className={btnSecondary} disabled={page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>
            Berikutnya →
          </button>
        </div>
      )}
    </>
  );
}
