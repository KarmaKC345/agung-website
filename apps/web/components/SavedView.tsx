'use client';

import {
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  Package,
  ShoppingBag,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatRupiah, type CurrentPrice, type OrderStatus, type ProductSummary } from '@newagung/shared';
import { useShop, type CartLine, type PastOrder } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useHydrated } from '@/lib/use-hydrated';
import { ProductCard } from './ProductCard';

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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

  if (failed) return <p className="text-danger">Daftar favorit belum berhasil dimuat. Silakan muat ulang halaman.</p>;
  if (!items) return <div className="h-40" aria-busy />;
  if (!items.length) {
    return (
      <div className="card flex flex-col items-center rounded-[var(--radius-media)] px-6 py-12 text-center">
        <p className="text-[17px] font-semibold text-ink">Belum ada produk favorit</p>
        <p className="mt-1.5 max-w-md text-[14px] text-muted">
          Tekan ikon simpan pada foto produk di etalase untuk menyimpannya ke daftar ini.
        </p>
        <Link href="/barang" className="btn btn-primary mt-5">
          Lihat katalog produk
        </Link>
      </div>
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

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  baru: {
    label: 'Menunggu Konfirmasi',
    badgeCls: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300',
  },
  disiapkan: {
    label: 'Sedang Diproses',
    badgeCls: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300',
  },
  siap: {
    label: 'Siap Diambil/Dikirim',
    badgeCls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300',
  },
  selesai: {
    label: 'Selesai',
    badgeCls: 'bg-green-100 text-green-900 dark:bg-green-950/80 dark:text-green-300',
  },
  batal: {
    label: 'Dibatalkan',
    badgeCls: 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300',
  },
};

function OrderCard({
  order,
  liveStatus,
}: {
  order: PastOrder;
  liveStatus?: OrderStatus;
}) {
  const add = useShop((s) => s.add);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<ReorderNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const status = liveStatus ?? 'baru';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.baru!;

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
      setError('Harga terbaru belum berhasil dimuat. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  const visibleLines = expanded ? order.lines : order.lines.slice(0, 2);
  const hasMore = order.lines.length > 2;

  return (
    <li className="card overflow-hidden rounded-[var(--radius-media)] border border-line bg-surface p-4 sm:p-5">
      {/* Header Transaksi (Gaya Tokopedia/Shopee) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} weight="bold" className="text-brand shrink-0" aria-hidden />
          <span className="text-[13px] font-semibold text-ink">Pesanan Toko</span>
          <span className="text-muted text-[12px]">·</span>
          <span className="text-[12px] text-muted">{dateFmt.format(new Date(order.createdAt))}</span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.badgeCls}`}
        >
          {cfg.label}
        </span>
      </div>

      <div className="pt-2">
        <p className="font-mono text-[12px] text-muted">
          Kode: <span className="font-medium text-ink select-all">{order.code}</span>
        </p>
      </div>

      {/* Daftar Produk dengan Gambar & Link Produk */}
      <ul className="mt-3 space-y-3">
        {visibleLines.map((l) => {
          const href = l.slug ? `/barang/${l.slug}` : `/cari?q=${encodeURIComponent(l.name)}`;
          return (
            <li key={`${l.variantId}|${l.unit}`} className="flex gap-3">
              <Link
                href={href}
                className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-white hover:opacity-90 sm:size-18"
              >
                {l.image ? (
                  <Image src={l.image} alt={l.name} fill sizes="72px" className="object-contain p-1" />
                ) : (
                  <Package size={24} weight="thin" className="text-muted" aria-hidden />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="line-clamp-2 text-[14px] font-medium text-ink hover:text-brand-text hover:underline"
                >
                  {l.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-baseline gap-2 text-[12px] text-muted">
                  {l.variantLabel && <span>Varian: {l.variantLabel}</span>}
                  <span>
                    {l.qty} {l.unit} × {formatRupiah(l.price)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-[12px] font-medium text-brand-text hover:underline"
        >
          {expanded ? (
            <>
              Tutup sebagian produk <CaretUp size={14} weight="bold" aria-hidden />
            </>
          ) : (
            <>
              Lihat {order.lines.length - 2} produk lainnya <CaretDown size={14} weight="bold" aria-hidden />
            </>
          )}
        </button>
      )}

      <hr className="receipt-rule my-4" />

      {/* Footer Transaksi: Total & Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[12px] text-muted">Total Belanja</span>
          <p className="price text-[18px] font-bold text-ink sm:text-[20px]">{formatRupiah(order.total)}</p>
        </div>

        <div className="flex items-center gap-2">
          {order.code && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Halo Toko New Agung, saya ingin cek status pesanan saya dengan kode ${order.code}`)}`}
              target="_blank"
              rel="noopener"
              className="btn btn-secondary text-[13px] px-3 py-1.5 h-10"
              title="Hubungi toko"
            >
              <WhatsappLogo size={16} weight="bold" aria-hidden />
              Tanya Toko
            </a>
          )}
          <button
            type="button"
            onClick={reorder}
            disabled={busy}
            className="btn btn-primary text-[13px] px-4 py-1.5 h-10"
          >
            {busy ? 'Memeriksa…' : 'Pesan kembali'}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      {note && (
        <div role="status" className="mt-3 rounded-[10px] bg-sunken p-3.5 text-[13px]">
          <p className="font-semibold">{note.added} produk telah ditambahkan ke keranjang dengan harga terbaru.</p>
          {note.changed.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {note.changed.map((c) => (
                <li key={c.name}>
                  {c.name}: {formatRupiah(c.from)} → <b>{formatRupiah(c.to)}</b>
                </li>
              ))}
            </ul>
          )}
          {note.missing.length > 0 && <p className="mt-1 text-danger">Sudah tidak tersedia: {note.missing.join(', ')}</p>}
          <Link href="/keranjang" className="mt-2 inline-block font-semibold text-brand-text underline underline-offset-4">
            Lanjut ke keranjang
          </Link>
        </div>
      )}
    </li>
  );
}

type FilterStatus = 'semua' | 'diproses' | 'siap' | 'selesai' | 'batal';

function History() {
  const history = useShop((s) => s.history);
  const [filter, setFilter] = useState<FilterStatus>('semua');
  const [search, setSearch] = useState('');
  const [liveStatuses, setLiveStatuses] = useState<Record<string, OrderStatus>>({});

  // Sinkronisasi status order dari database API
  const syncStatuses = useCallback(() => {
    if (!history.length) return;
    const codes = history.map((o) => o.code);
    fetch(`${API_URL}/api/orders/statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, OrderStatus>) => setLiveStatuses(data))
      .catch(() => {});
  }, [history]);

  useEffect(() => {
    syncStatuses();
    const interval = setInterval(syncStatuses, 15000);
    window.addEventListener('focus', syncStatuses);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncStatuses);
    };
  }, [syncStatuses]);

  const filteredOrders = useMemo(() => {
    let list = [...history];

    // Filter Status
    if (filter === 'diproses') {
      list = list.filter((o) => {
        const s = liveStatuses[o.code] ?? 'baru';
        return s === 'baru' || s === 'disiapkan';
      });
    } else if (filter === 'siap') {
      list = list.filter((o) => (liveStatuses[o.code] ?? 'baru') === 'siap');
    } else if (filter === 'selesai') {
      list = list.filter((o) => (liveStatuses[o.code] ?? 'baru') === 'selesai');
    } else if (filter === 'batal') {
      list = list.filter((o) => (liveStatuses[o.code] ?? 'baru') === 'batal');
    }

    // Filter Pencarian (kode pesanan atau nama produk)
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.lines.some((l) => l.name.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [history, filter, search, liveStatuses]);

  if (!history.length) {
    return (
      <div className="card flex flex-col items-center rounded-[var(--radius-media)] p-10 text-center">
        <ShoppingBag size={40} weight="thin" className="text-muted" aria-hidden />
        <p className="mt-3 text-[17px] font-semibold text-ink">Belum ada riwayat pesanan</p>
        <p className="mt-1 max-w-md text-[14px] text-muted">
          Pesanan yang Anda kirim dari perangkat ini akan otomatis tercatat di sini sehingga Anda dapat melacak statusnya atau memesan kembali.
        </p>
        <Link href="/barang" className="btn btn-primary mt-5">
          Mulai belanja
        </Link>
      </div>
    );
  }

  const chips: { id: FilterStatus; label: string }[] = [
    { id: 'semua', label: 'Semua Status' },
    { id: 'diproses', label: 'Sedang Diproses' },
    { id: 'siap', label: 'Siap Diambil/Dikirim' },
    { id: 'selesai', label: 'Selesai' },
    { id: 'batal', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar (Gaya Tokopedia / Shopee) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} weight="bold" className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            placeholder="Cari nomor pesanan atau nama barang…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-tag border border-field bg-surface pr-8 pl-9 text-[13px] placeholder:text-muted focus:border-brand-text outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs / Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {chips.map((c) => {
          const on = filter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                on
                  ? 'bg-brand text-white shadow-xs'
                  : 'border border-line bg-surface text-ink hover:bg-sunken'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* List Pesanan */}
      {filteredOrders.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filteredOrders.map((o) => (
            <OrderCard key={o.code} order={o} liveStatus={liveStatuses[o.code]} />
          ))}
        </ul>
      ) : (
        <div className="card rounded-[var(--radius-media)] p-8 text-center text-muted">
          <p className="text-[14px]">Tidak ada pesanan yang sesuai dengan filter.</p>
          <button
            type="button"
            onClick={() => {
              setFilter('semua');
              setSearch('');
            }}
            className="mt-2 text-[13px] font-semibold text-brand-text underline underline-offset-4"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
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
      <div className="mt-5">{hydrated ? tab === 'favorit' ? <Favorites /> : <History /> : <div className="h-40" aria-busy />}</div>
      <p className="mt-6 text-[13px] text-muted">Favorit dan riwayat pesanan tersimpan di perangkat ini dan akan terhapus apabila data browser dibersihkan.</p>
    </>
  );
}
