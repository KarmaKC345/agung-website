'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatRupiah, type Fulfilment } from '@newagung/shared';
import { cartTotal, useShop, type CartLine } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useHydrated } from '@/lib/use-hydrated';
import { Price } from './Price';

type Problem = { variantId: string; unit: string; reason: 'tidak-ada' | 'habis' };
type Sent = { code: string; waUrl: string; total: number };

const key = (l: { variantId: string; unit: string }) => `${l.variantId}|${l.unit}`;

export function CartView() {
  const hydrated = useHydrated();
  const { lines, customer, setQty, remove, setCustomer, clear, recordOrder } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<Map<string, Problem['reason']>>(new Map());
  const [sent, setSent] = useState<Sent | null>(null);

  if (!hydrated) return <div className="h-64" aria-busy />;

  if (sent) {
    return (
      <div className="mx-auto max-w-lg rounded-tag border border-line bg-surface p-6">
        <p className="signage text-[12px] text-muted">Kode pesanan</p>
        <p className="mt-1 font-mono text-[26px] font-medium tracking-tight">{sent.code}</p>
        <p className="mt-4 leading-relaxed">
          Pesanan tersimpan dan WhatsApp sudah dibuka dengan pesan terisi. Tekan <b>kirim</b> di WhatsApp supaya toko menerimanya.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={sent.waUrl} className="inline-flex h-11 items-center rounded-tag bg-wa px-4 font-semibold text-white">
            Buka WhatsApp lagi
          </a>
          <Link href="/" className="inline-flex h-11 items-center rounded-tag border border-line-strong px-4 font-semibold">
            Kembali belanja
          </Link>
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Pesanan ini juga tersimpan di <Link href="/favorit?tab=riwayat" className="underline underline-offset-4">Riwayat</Link> untuk dipesan ulang nanti.
        </p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="rounded-tag border border-dashed border-line-strong bg-surface p-8 text-center">
        <p className="text-[17px] font-semibold">Keranjang masih kosong.</p>
        <p className="mt-1 text-muted">Cari barang atau pilih lorong, lalu tekan “Masukkan keranjang”.</p>
        <Link href="/kategori" className="mt-5 inline-flex h-11 items-center rounded-tag bg-ink px-4 font-semibold text-surface">
          Lihat semua lorong
        </Link>
      </div>
    );
  }

  const total = cartTotal(lines);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
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
          pickupNote: customer.pickupNote.trim(),
          items: lines.map((l) => ({ variantId: l.variantId, unit: l.unit, qty: l.qty })),
          website: String(form.get('website') ?? ''),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data?.details?.problems) {
        setProblems(new Map((data.details.problems as Problem[]).map((p) => [key(p), p.reason])));
        setError('Ada barang yang sudah habis atau tidak dijual lagi. Hapus barang yang ditandai, lalu kirim lagi.');
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? 'Pesanan gagal dikirim. Coba lagi.');
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
      setError('Tidak tersambung ke server. Periksa koneksi internet, lalu kirim lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <ul className="divide-y divide-line border-y border-line bg-surface">
        {lines.map((l) => {
          const problem = problems.get(key(l));
          return (
            <li key={key(l)} className={`flex gap-3 p-3 ${problem ? 'bg-danger/5' : ''}`}>
              <div className="min-w-0 flex-1">
                <Link href={`/barang/${l.slug}`} className="font-medium hover:underline">
                  {l.name}
                </Link>
                <p className="text-[13px] text-muted">
                  {l.variantLabel && <>{l.variantLabel} · </>}
                  {formatRupiah(l.price)}/{l.unit}
                </p>
                {problem && (
                  <p className="mt-1 text-[13px] font-semibold text-danger">
                    {problem === 'habis' ? 'Stok habis' : 'Sudah tidak dijual dengan satuan ini'}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-tag border border-line-strong">
                    <button type="button" className="h-full w-9" onClick={() => setQty(l.variantId, l.unit, l.qty - 1)} aria-label={`Kurangi ${l.name}`}>
                      −
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
                    <button type="button" className="h-full w-9" onClick={() => setQty(l.variantId, l.unit, l.qty + 1)} aria-label={`Tambah ${l.name}`}>
                      +
                    </button>
                  </div>
                  <span className="text-[13px] text-muted">{l.unit}</span>
                  <button type="button" onClick={() => remove(l.variantId, l.unit)} className="ml-auto text-[13px] font-medium text-muted underline underline-offset-4 hover:text-danger">
                    Hapus
                  </button>
                </div>
              </div>
              <Price value={l.price * l.qty} className="shrink-0 pt-0.5 text-[19px]" />
            </li>
          );
        })}
      </ul>

      {/* Nota & formulir */}
      <form onSubmit={submit} className="h-fit rounded-tag border border-line bg-surface p-5 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Perkiraan total</span>
          <Price value={total} className="text-[30px]" />
        </div>
        <p className="mt-1 text-[13px] text-muted">{lines.length} jenis barang. Harga akhir dikonfirmasi toko.</p>
        <hr className="receipt-rule my-5" />

        <label className="block text-[14px] font-semibold" htmlFor="nama">
          Nama
        </label>
        <input
          id="nama"
          required
          maxLength={80}
          autoComplete="name"
          value={customer.name}
          onChange={(e) => setCustomer({ name: e.target.value })}
          className="mt-1 h-11 w-full rounded-tag border border-line-strong bg-surface px-3"
        />

        <fieldset className="mt-4">
          <legend className="text-[14px] font-semibold">Cara terima</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                ['ambil', 'Ambil di toko'],
                ['antar', 'Minta diantar'],
              ] as [Fulfilment, string][]
            ).map(([v, label]) => (
              <label
                key={v}
                className="flex h-11 cursor-pointer items-center justify-center rounded-tag border border-line-strong text-[14px] font-medium has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-surface"
              >
                <input type="radio" name="fulfilment" value={v} checked={customer.fulfilment === v} onChange={() => setCustomer({ fulfilment: v })} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {customer.fulfilment === 'antar' && <p className="mt-2 text-[13px] text-muted">Ongkir dan alamat dibicarakan di WhatsApp.</p>}

        <label className="mt-4 block text-[14px] font-semibold" htmlFor="catatan">
          {customer.fulfilment === 'ambil' ? 'Jam ambil (opsional)' : 'Catatan (opsional)'}
        </label>
        <input
          id="catatan"
          maxLength={200}
          placeholder={customer.fulfilment === 'ambil' ? 'mis. jam 16.00' : 'mis. kantor di Jl. Sudirman'}
          value={customer.pickupNote}
          onChange={(e) => setCustomer({ pickupNote: e.target.value })}
          className="mt-1 h-11 w-full rounded-tag border border-line-strong bg-surface px-3"
        />

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
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-tag bg-wa px-4 text-[16px] font-semibold text-white disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
          </svg>
          {busy ? 'Menyimpan pesanan…' : 'Kirim pesanan lewat WhatsApp'}
        </button>
        <p className="mt-2 text-center text-[12px] text-muted">WhatsApp terbuka dengan daftar ini. Tekan kirim di sana.</p>
      </form>
    </div>
  );
}
