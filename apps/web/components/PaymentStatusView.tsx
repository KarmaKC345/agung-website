'use client';

import { CheckCircle, Clock, XCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatRupiah } from '@newagung/shared';
import { API_URL } from '@/lib/config';
import { CenteredLoading } from './CenteredLoading';

interface Payment {
  code: string;
  total: number;
  status: string;
  paymentStatus: 'none' | 'pending' | 'paid' | 'failed' | 'expired';
}

/** Halaman tujuan setelah pembeli kembali dari DANA. Status dicek ulang tiap 4 detik sampai final. */
export function PaymentStatusView({ code }: { code: string }) {
  const [p, setP] = useState<Payment | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const r = await fetch(`${API_URL}/api/payments/${encodeURIComponent(code)}`, { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const data = (await r.json()) as Payment;
        if (stop) return;
        setP(data);
        if (data.paymentStatus === 'pending') timer = setTimeout(check, 4000);
      } catch {
        if (!stop) setError(true);
      }
    }
    void check();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [code]);

  if (error) return <p className="card mx-auto max-w-lg p-8 text-center text-danger">Pesanan {code} tidak ditemukan.</p>;
  if (!p) return <CenteredLoading text="Memeriksa pembayaran…" />;

  const view = {
    paid: { icon: <CheckCircle size={44} weight="fill" className="text-ok" />, title: 'Pembayaran berhasil', text: 'Terima kasih! Pesanan Anda sudah lunas dan sedang disiapkan oleh toko.' },
    pending: { icon: <Clock size={44} weight="fill" className="animate-pulse text-warn" />, title: 'Menunggu pembayaran', text: 'Selesaikan pembayaran di aplikasi atau halaman DANA. Halaman ini akan berubah otomatis.' },
    failed: { icon: <XCircle size={44} weight="fill" className="text-danger" />, title: 'Pembayaran gagal', text: 'Pembayaran tidak berhasil dan pesanan dibatalkan. Silakan pesan kembali.' },
    expired: { icon: <XCircle size={44} weight="fill" className="text-danger" />, title: 'Waktu pembayaran habis', text: 'Batas waktu bayar sudah lewat dan pesanan dibatalkan. Silakan pesan kembali.' },
    none: { icon: <CheckCircle size={44} weight="fill" className="text-ok" />, title: 'Pesanan diterima', text: 'Pesanan ini dibayar di toko atau lewat WhatsApp.' },
  }[p.paymentStatus];

  return (
    <div className="card mx-auto max-w-lg rounded-[var(--radius-media)] p-6 text-center sm:p-8" role="status" aria-live="polite">
      <div className="flex justify-center" aria-hidden>
        {view.icon}
      </div>
      <h1 className="mt-4 text-[22px] font-bold">{view.title}</h1>
      <p className="mt-2 leading-relaxed text-muted">{view.text}</p>
      <dl className="mt-6 grid grid-cols-2 gap-y-2 rounded-tag bg-sunken p-4 text-left text-[14px]">
        <dt className="text-muted">Kode pesanan</dt>
        <dd className="text-right font-mono font-medium">{p.code}</dd>
        <dt className="text-muted">Total</dt>
        <dd className="price text-right">{formatRupiah(p.total)}</dd>
      </dl>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/favorit?tab=riwayat" className="btn btn-primary">
          Lihat riwayat pesanan
        </Link>
        <Link href="/" className="btn btn-secondary">
          Lanjut belanja
        </Link>
      </div>
    </div>
  );
}
