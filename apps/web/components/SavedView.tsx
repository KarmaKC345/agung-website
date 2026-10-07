'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatRupiah, type CurrentPrice, type ProductSummary } from '@newagung/shared';
import { useShop, type CartLine, type PastOrder } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useHydrated } from '@/lib/use-hydrated';
import { ProductCard } from './ProductCard';

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Favorites() {
  const ids = useShop((s) => s.favorites);
  const [items, setItems] = useState<ProductSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ids.length) {
      setItems([]);
      return;
    }
    fetch(`${API_URL}/api/products/by-ids?ids=${ids.slice(0, 100).join(',')}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setFailed(true));
  }, [ids]);

  if (failed) return <p className="text-danger">Favorit gagal dimuat. Muat ulang halaman.</p>;
  if (!items) return <div className="h-40" aria-busy />;
  if (!items.length) {
    return (
      <p className="card rounded-[var(--radius-media)] p-10 text-center text-muted">
        Belum ada favorit. Tekan ikon penanda di foto barang untuk menyimpannya di sini.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

interface ReorderNote {
  changed: { name: string; from: number; to: number }[];
  missing: string[];
  added: number;
}

function OrderCard({ order }: { order: PastOrder }) {
  const add = useShop((s) => s.add);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<ReorderNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function reorder() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/variants/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: order.lines.map((l) => ({ variantId: l.variantId, unit: l.unit })) }),
      });
      if (!res.ok) throw new Error();
      const current = (await res.json()) as CurrentPrice[];
      const result: ReorderNote = { changed: [], missing: [], added: 0 };
      order.lines.forEach((l: CartLine, i) => {
        const c = current[i];
        if (!c || c.price === null || c.stockStatus === 'habis' || c.stockStatus === null) {
          result.missing.push(l.name + (l.variantLabel ? ` (${l.variantLabel})` : ''));
          return;
        }
        if (c.price !== l.price) result.changed.push({ name: l.name, from: l.price, to: c.price });
        const { qty, ...rest } = l;
        add({ ...rest, price: c.price }, qty);
        result.added++;
      });
      if (!result.changed.length && !result.missing.length) {
        router.push('/keranjang');
        return;
      }
      setNote(result);
    } catch {
      setError('Harga terbaru gagal dimuat. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[15px] font-medium">{order.code}</span>
        <span className="text-[13px] text-muted">{dateFmt.format(new Date(order.createdAt))}</span>
      </div>
      <ul className="mt-3 space-y-1 text-[14px]">
        {order.lines.map((l) => (
          <li key={`${l.variantId}|${l.unit}`} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {l.name}
              {l.variantLabel && <span className="text-muted"> · {l.variantLabel}</span>}
            </span>
            <span className="shrink-0 text-muted tabular-nums">
              {l.qty} {l.unit}
            </span>
          </li>
        ))}
      </ul>
      <hr className="receipt-rule my-3" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[14px]">
          Total waktu itu <b className="tabular-nums">{formatRupiah(order.total)}</b>
        </span>
        <button
          type="button"
          onClick={reorder}
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? 'Memeriksa harga…' : 'Pesan lagi'}
        </button>
      </div>
      {error && <p className="mt-2 text-[14px] text-danger">{error}</p>}
      {note && (
        <div role="status" className="mt-3 rounded-[10px] bg-sunken p-3.5 text-[14px]">
          <p className="font-semibold">{note.added} barang masuk keranjang dengan harga terbaru.</p>
          {note.changed.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {note.changed.map((c) => (
                <li key={c.name}>
                  {c.name}: {formatRupiah(c.from)} → <b>{formatRupiah(c.to)}</b>
                </li>
              ))}
            </ul>
          )}
          {note.missing.length > 0 && <p className="mt-1 text-danger">Tidak tersedia lagi: {note.missing.join(', ')}</p>}
          <Link href="/keranjang" className="mt-2 inline-block font-semibold text-brand-text underline underline-offset-4">
            Lanjut ke keranjang
          </Link>
        </div>
      )}
    </li>
  );
}

function History() {
  const history = useShop((s) => s.history);
  if (!history.length) {
    return (
      <p className="card rounded-[var(--radius-media)] p-10 text-center text-muted">
        Pesanan yang dikirim dari perangkat ini akan muncul di sini, supaya bisa dipesan ulang dengan sekali tekan.
      </p>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {history.map((o) => (
        <OrderCard key={o.code} order={o} />
      ))}
    </ul>
  );
}

export function SavedView() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get('tab') === 'riwayat' ? 'riwayat' : 'favorit';

  const tabBtn = (id: 'favorit' | 'riwayat', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => router.replace(id === 'favorit' ? '/favorit' : '/favorit?tab=riwayat', { scroll: false })}
      className="h-11 border-b-2 border-transparent px-1 text-[16px] font-semibold text-muted hover:text-ink aria-selected:border-brand-text aria-selected:text-ink"
    >
      {label}
    </button>
  );

  return (
    <>
      <div role="tablist" className="flex gap-6 border-b border-line">
        {tabBtn('favorit', 'Favorit')}
        {tabBtn('riwayat', 'Riwayat pesanan')}
      </div>
      <div className="mt-5">{!hydrated ? <div className="h-40" aria-busy /> : tab === 'favorit' ? <Favorites /> : <History />}</div>
      <p className="mt-6 text-[13px] text-muted">Favorit dan riwayat tersimpan di perangkat ini saja. Data hilang bila riwayat browser dibersihkan.</p>
    </>
  );
}
