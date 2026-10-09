'use client';

import { Basket, CheckCircle, Minus, Package, Plus, Trash, WhatsappLogo } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatRupiah, formatTime, hoursToday, summarizeHours, type Fulfilment, type WeeklyHours } from '@newagung/shared';
import { cartTotal, useShop, type CartLine } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useHydrated } from '@/lib/use-hydrated';
import { Price } from './Price';

type Problem = { variantId: string; unit: string; reason: 'tidak-ada' | 'habis' };
type Sent = { code: string; waUrl: string; total: number };

const key = (l: { variantId: string; unit: string }) => `${l.variantId}|${l.unit}`;

export function CartView({ hours, timezone }: { hours: WeeklyHours; timezone: string }) {
  const hydrated = useHydrated();
  const { lines, customer, setQty, remove, setCustomer, clear, recordOrder } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<Map<string, Problem['reason']>>(new Map());
  const [sent, setSent] = useState<Sent | null>(null);
  // rentang jam ambil = jam buka hari ini (WITA); cadangan 05.00-22.00
  const today = useMemo(() => hoursToday(hours, timezone), [hours, timezone]);
  const window_ = today ?? { open: '05:00', close: '22:00' };
  const timeSlots = useMemo(() => {
    const [openH = 5, openM = 0] = (window_.open || '05:00').split(':').map(Number);
    const [closeH = 22, closeM = 0] = (window_.close || '22:00').split(':').map(Number);
    const start = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    const slots: string[] = [];
    for (let m = start; m <= end; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, [window_.open, window_.close]);
  const summary = summarizeHours(hours);
  const hoursInfo = summary
    ? `Jam buka: ${summary.charAt(0).toLowerCase()}${summary.slice(1)} WITA.`
    : today
      ? `Hari ini buka pukul ${formatTime(today.open)}-${formatTime(today.close)} WITA.`
      : 'Hari ini toko tutup.';
  const pickupTime = customer.pickupTime ?? '';

  if (!hydrated) return <div className="h-64" aria-busy />;

  if (sent) {
    return (
      <div className="card mx-auto max-w-lg rounded-[var(--radius-media)] p-6 sm:p-8">
        <CheckCircle size={40} weight="fill" className="text-ok" aria-hidden />
        <p className="mt-4 text-[14px] font-medium text-muted">Kode pesanan</p>
        <p className="mt-1 font-mono text-[26px] font-medium tracking-tight">{sent.code}</p>
        <p className="mt-4 leading-relaxed">
          Pesanan Anda telah tersimpan dan WhatsApp telah terbuka dengan rincian pesanan. Tekan <b>Kirim</b> di WhatsApp agar pesanan diterima oleh tim kami.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={sent.waUrl} className="btn btn-wa">
            <WhatsappLogo size={20} weight="bold" aria-hidden />
            Buka WhatsApp kembali
          </a>
          <Link href="/" className="btn btn-secondary">
            Lanjut belanja
          </Link>
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Pesanan ini juga tersimpan di <Link href="/favorit?tab=riwayat" className="underline underline-offset-4">Riwayat pesanan</Link>, sehingga Anda dapat memesannya kembali dengan sekali tekan.
        </p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center rounded-[var(--radius-media)] px-6 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-tint text-brand-text">
          <Basket size={30} weight="bold" aria-hidden />
        </span>
        <p className="mt-5 text-[18px] font-semibold">Keranjang Anda masih kosong</p>
        <p className="mt-1 text-muted">Temukan produk yang Anda butuhkan, lalu tekan tombol “+ Keranjang”.</p>
        <Link href="/barang" className="btn btn-primary mt-6">
          Mulai belanja
        </Link>
      </div>
    );
  }

  const total = cartTotal(lines);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (customer.fulfilment === 'ambil' && pickupTime && (pickupTime < window_.open || pickupTime > window_.close)) {
      setError(`Jam pengambilan harus di antara pukul ${formatTime(window_.open)} dan ${formatTime(window_.close)}.`);
      return;
    }
    setBusy(true);
    setError(null);
    setProblems(new Map());
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name.trim(),
          fulfilment: customer.fulfilment,
          pickupNote: customer.fulfilment === 'ambil' ? (pickupTime ? `pukul ${formatTime(pickupTime)}` : '') : customer.pickupNote.trim(),
          items: lines.map((l) => ({ variantId: l.variantId, unit: l.unit, qty: l.qty })),
          website: String(form.get('website') ?? ''),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data?.details?.problems) {
        setProblems(new Map((data.details.problems as Problem[]).map((p) => [key(p), p.reason])));
        setError('Beberapa produk sudah habis atau tidak tersedia lagi. Hapus produk yang ditandai, lalu kirim kembali pesanan Anda.');
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? 'Pesanan belum berhasil dikirim. Silakan coba kembali.');
        return;
      }
      // pakai harga dari server untuk riwayat
      const priced: CartLine[] = lines.map((l) => {
        const srv = (data.items as { variantId: string; unit: string; price: number }[]).find((i) => key(i) === key(l));
        return srv ? { ...l, price: srv.price } : l;
      });
      recordOrder({ code: data.code, createdAt: new Date().toISOString(), total: data.total, lines: priced });
      clear();
      setSent({ code: data.code, waUrl: data.waUrl, total: data.total });
      window.location.href = data.waUrl;
    } catch {
      setError('Koneksi ke server terputus. Periksa koneksi internet Anda, lalu coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <ul className="card h-fit divide-y divide-line overflow-hidden">
        {lines.map((l) => {
          const problem = problems.get(key(l));
          return (
            <li key={key(l)} className={`flex gap-3 p-3 sm:gap-4 sm:p-4 ${problem ? 'bg-danger/5' : ''}`}>
              <Link href={`/barang/${l.slug}`} tabIndex={-1} aria-hidden className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-sunken sm:size-20">
                {l.image ? <Image src={l.image} alt="" fill sizes="80px" className="object-contain p-1.5" /> : <Package size={26} weight="thin" className="text-muted" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/barang/${l.slug}`} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                    <p className="text-[13px] text-muted">
                      {l.variantLabel && <>{l.variantLabel} · </>}
                      {formatRupiah(l.price)}/{l.unit}
                    </p>
                  </div>
                  <Price value={l.price * l.qty} className="shrink-0 pt-0.5 text-[18px]" />
                </div>
                {problem && (
                  <p className="mt-1 text-[13px] font-semibold text-danger">
                    {problem === 'habis' ? 'Stok habis' : 'Satuan ini sudah tidak tersedia'}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 items-center rounded-tag border border-field">
                    <button type="button" className="grid h-full w-11 place-items-center rounded-l-tag hover:bg-sunken" onClick={() => setQty(l.variantId, l.unit, l.qty - 1)} aria-label={`Kurangi ${l.name}`}>
                      <Minus size={16} weight="bold" aria-hidden />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={l.qty}
                      min={1}
                      onChange={(e) => setQty(l.variantId, l.unit, Number(e.target.value) || 1)}
                      aria-label={`Jumlah ${l.name}`}
                      className="price h-full w-12 bg-transparent text-center text-[17px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button type="button" className="grid h-full w-11 place-items-center rounded-r-tag hover:bg-sunken" onClick={() => setQty(l.variantId, l.unit, l.qty + 1)} aria-label={`Tambah ${l.name}`}>
                      <Plus size={16} weight="bold" aria-hidden />
                    </button>
                  </div>
                  <span className="text-[13px] text-muted">{l.unit}</span>
                  <button
                    type="button"
                    onClick={() => remove(l.variantId, l.unit)}
                    aria-label={`Hapus ${l.name} dari keranjang`}
                    className="tap ml-auto -mr-2 grid size-10 place-items-center rounded-[10px] text-muted hover:bg-sunken hover:text-danger"
                  >
                    <Trash size={20} aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Nota & formulir */}
      <form onSubmit={submit} className="card h-fit rounded-[var(--radius-media)] p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <Price value={total} className="text-[30px]" />
        </div>
        <p className="mt-1 text-[13px] text-muted">{lines.length} jenis produk. Harga akhir dikonfirmasi oleh toko melalui WhatsApp.</p>
        <hr className="receipt-rule my-5" />

        <label className="block text-[14px] font-semibold" htmlFor="nama">
          Nama pemesan
        </label>
        <input
          id="nama"
          required
          maxLength={80}
          autoComplete="name"
          value={customer.name}
          onChange={(e) => setCustomer({ name: e.target.value })}
          className="mt-1 h-11 w-full rounded-tag border border-field bg-surface px-3"
        />

        <fieldset className="mt-4">
          <legend className="text-[14px] font-semibold">Cara menerima pesanan</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                ['ambil', 'Ambil di toko'],
                ['antar', 'Diantar'],
              ] as [Fulfilment, string][]
            ).map(([v, label]) => (
              <label
                key={v}
                className="flex h-11 cursor-pointer items-center justify-center rounded-tag border border-field text-[14px] font-medium has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-text"
              >
                <input type="radio" name="fulfilment" value={v} checked={customer.fulfilment === v} onChange={() => setCustomer({ fulfilment: v })} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {customer.fulfilment === 'antar' && <p className="mt-2 text-[13px] text-muted">Alamat dan ongkos kirim dikonfirmasi melalui WhatsApp.</p>}

        {customer.fulfilment === 'ambil' ? (
          <>
            <label className="mt-4 block text-[14px] font-semibold" htmlFor="jam-ambil">
              Jam pengambilan (opsional)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <select
                id="jam-ambil"
                value={pickupTime}
                onChange={(e) => setCustomer({ pickupTime: e.target.value })}
                aria-describedby="jam-ambil-info"
                className="h-11 min-w-0 flex-1 rounded-tag border border-field bg-surface px-3 text-[14px]"
              >
                <option value="">Pilih jam (bebas / kapan saja)</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTime(slot)} WITA
                  </option>
                ))}
              </select>
              {pickupTime && (
                <button
                  type="button"
                  onClick={() => setCustomer({ pickupTime: '' })}
                  className="tap shrink-0 text-[13px] font-medium text-muted underline underline-offset-4 hover:text-ink"
                >
                  Hapus
                </button>
              )}
            </div>
            <p id="jam-ambil-info" className="mt-1 text-[12px] text-muted">
              {hoursInfo} Boleh dikosongkan.
            </p>
          </>
        ) : (
          <>
            <label className="mt-4 block text-[14px] font-semibold" htmlFor="catatan">
              Catatan (opsional)
            </label>
            <input
              id="catatan"
              maxLength={200}
              placeholder="Contoh: alamat pengantaran atau patokan lokasi"
              value={customer.pickupNote}
              onChange={(e) => setCustomer({ pickupNote: e.target.value })}
              className="mt-1 h-11 w-full rounded-tag border border-field bg-surface px-3"
            />
          </>
        )}

        {/* jebakan bot: disembunyikan dari pengguna */}
        <div aria-hidden className="absolute -left-[9999px]">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[14px] font-medium text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-wa btn-lg mt-6 w-full"
        >
          <WhatsappLogo size={22} weight="bold" aria-hidden />
          {busy ? 'Menyimpan pesanan…' : 'Kirim pesanan via WhatsApp'}
        </button>
        <p className="mt-2 text-center text-[12px] text-muted">WhatsApp akan terbuka dengan rincian pesanan Anda. Tekan Kirim untuk menyelesaikan pesanan.</p>
      </form>
    </div>
  );
}
