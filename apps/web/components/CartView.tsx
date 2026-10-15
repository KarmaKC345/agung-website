'use client';

import {
  Basket,
  ChatCircleDots,
  CheckCircle,
  CreditCard,
  MapPin,
  Minus,
  Motorcycle,
  Package,
  Plus,
  ShieldCheck,
  Storefront,
  Trash,
  Truck,
  Wallet,
  WhatsappLogo,
} from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  formatRupiah,
  formatTime,
  hoursToday,
  summarizeHours,
  type Fulfilment,
  type ShippingRate,
  type WeeklyHours,
} from '@newagung/shared';
import { cartTotal, useShop, type CartLine } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useHydrated } from '@/lib/use-hydrated';
import { Price } from './Price';

const MapPickerModal = dynamic(
  () => import('./MapPickerModal').then((m) => m.MapPickerModal),
  { ssr: false },
);

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
  const [nameTouched, setNameTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  // Modal Peta Interaktif & Nama Bangunan/Jalan
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');

  // Kurir pengiriman (Gojek / Grab / Kurir Toko)
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Rentang jam ambil di toko
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
  const [danaReady, setDanaReady] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/payments/config`)
      .then((r) => (r.ok ? r.json() : { dana: false }))
      .then((c: { dana: boolean }) => setDanaReady(c.dana))
      .catch(() => {});
  }, []);

  const itemsTotal = cartTotal(lines);
  const isDelivery = customer.fulfilment === 'antar';
  const shippingCost = isDelivery ? (customer.shippingCost ?? 0) : 0;
  const grandTotal = itemsTotal + shippingCost;
  const payDana = danaReady && customer.paymentMethod === 'dana';

  const nameError = nameTouched && !customer.name.trim();
  const addressError = addressTouched && isDelivery && !customer.deliveryAddress?.trim();

  // Fetch tarif kurir dari backend
  const fetchRates = useCallback(
    async (lat?: number | null, lng?: number | null) => {
      setLoadingRates(true);
      try {
        const res = await fetch(`${API_URL}/api/shipping/rates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: lat !== undefined ? lat : customer.deliveryLat,
            lng: lng !== undefined ? lng : customer.deliveryLng,
            totalValue: itemsTotal,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { rates: ShippingRate[] };
          if (Array.isArray(data.rates) && data.rates.length > 0) {
            setRates(data.rates);
            // Pilih kurir pertama jika belum ada pilihan atau kurir lama tidak ada
            const match = data.rates.find(
              (r) => r.courierName === customer.shippingCourier && r.serviceName === customer.shippingService,
            );
            if (match) {
              setCustomer({
                shippingCost: match.price,
              });
            } else {
              const def = data.rates[0]!;
              setCustomer({
                shippingCourier: def.courierName,
                shippingService: def.serviceName,
                shippingCost: def.price,
              });
            }
          }
        }
      } catch {
        // Fallback tetap aktif
      } finally {
        setLoadingRates(false);
      }
    },
    [customer.deliveryLat, customer.deliveryLng, customer.shippingCourier, customer.shippingService, itemsTotal, setCustomer],
  );

  useEffect(() => {
    if (isDelivery) {
      void fetchRates(customer.deliveryLat, customer.deliveryLng);
    }
  }, [isDelivery, fetchRates, customer.deliveryLat, customer.deliveryLng]);

  if (!hydrated) return <div className="h-64" aria-busy />;

  if (sent) {
    return (
      <div className="card mx-auto max-w-lg rounded-[var(--radius-media)] p-6 sm:p-8">
        <CheckCircle size={44} weight="fill" className="text-ok" aria-hidden />
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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (!customer.name.trim()) {
      setNameTouched(true);
      setError('Nama pemesan wajib diisi.');
      return;
    }

    if (customer.fulfilment === 'ambil' && pickupTime && (pickupTime < window_.open || pickupTime > window_.close)) {
      setError(`Jam pengambilan harus di antara pukul ${formatTime(window_.open)} dan ${formatTime(window_.close)}.`);
      return;
    }

    if (isDelivery && !customer.deliveryAddress?.trim()) {
      setAddressTouched(true);
      setError('Alamat pengantaran lengkap wajib diisi untuk pesanan diantar.');
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
          paymentMethod: payDana ? 'dana' : 'wa',
          pickupNote: customer.fulfilment === 'ambil' ? (pickupTime ? `pukul ${formatTime(pickupTime)}` : '') : customer.pickupNote.trim(),
          deliveryAddress: isDelivery ? customer.deliveryAddress?.trim() : '',
          deliveryLat: isDelivery ? customer.deliveryLat : null,
          deliveryLng: isDelivery ? customer.deliveryLng : null,
          shippingCourier: isDelivery ? customer.shippingCourier : '',
          shippingService: isDelivery ? customer.shippingService : '',
          shippingCost: isDelivery ? shippingCost : 0,
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

      // Pakai harga dari server untuk riwayat
      const priced: CartLine[] = lines.map((l) => {
        const srv = (data.items as { variantId: string; unit: string; price: number }[]).find((i) => key(i) === key(l));
        return srv ? { ...l, price: srv.price } : l;
      });

      recordOrder({
        code: data.code,
        createdAt: new Date().toISOString(),
        total: data.total,
        paymentMethod: payDana ? 'dana' : 'wa',
        shippingCourier: isDelivery ? customer.shippingCourier : undefined,
        shippingService: isDelivery ? customer.shippingService : undefined,
        shippingCost: isDelivery ? shippingCost : 0,
        deliveryAddress: isDelivery ? customer.deliveryAddress : undefined,
        lines: priced,
      });

      clear();

      if (data.payUrl) {
        window.location.href = data.payUrl;
        return;
      }
      setSent({ code: data.code, waUrl: data.waUrl, total: data.total });
      window.location.href = data.waUrl;
    } catch {
      setError('Koneksi ke server terputus. Periksa koneksi internet Anda, lalu coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Modal Peta Interaktif Ubah Alamat / Pin Point ala Shopee */}
      {showMapModal && (
        <MapPickerModal
          initialLat={customer.deliveryLat}
          initialLng={customer.deliveryLng}
          initialAddress={customer.deliveryAddress}
          onConfirm={(loc) => {
            setCustomer({
              deliveryLat: loc.lat,
              deliveryLng: loc.lng,
              deliveryAddress: loc.fullAddress,
            });
            setSelectedBuilding(loc.building);
            void fetchRates(loc.lat, loc.lng);
          }}
          onClose={() => setShowMapModal(false)}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Kolom Kiri: Alur Checkout Tokopedia/Shopee Style */}
        <form id="checkout-form" onSubmit={submit} className="space-y-6">
          {/* Section 1: Cara Terima & Alamat Pengiriman */}
          <div className="card rounded-[var(--radius-media)] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={20} weight="bold" className="text-brand shrink-0" aria-hidden />
                <h2 className="text-[16px] font-bold text-ink">Cara Menerima Pesanan</h2>
              </div>
              <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-[11px] font-semibold text-brand-text">
                Toko New Agung Makassar
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  ['ambil', 'Ambil di Toko', 'Ambil sendiri di toko'],
                  ['antar', 'Diantar ke Lokasi', 'Gojek / Grab / Kurir'],
                ] as [Fulfilment, string, string][]
              ).map(([v, label, sub]) => (
                <label
                  key={v}
                  className="flex cursor-pointer flex-col rounded-tag border p-3 transition-all has-[:checked]:border-brand has-[:checked]:bg-brand-tint has-[:checked]:shadow-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-text"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-ink">{label}</span>
                    <input
                      type="radio"
                      name="fulfilment"
                      value={v}
                      checked={customer.fulfilment === v}
                      onChange={() => setCustomer({ fulfilment: v })}
                      className="size-4 accent-[var(--color-brand)]"
                    />
                  </div>
                  <span className="mt-0.5 text-[12px] text-muted">{sub}</span>
                </label>
              ))}
            </div>

            {/* Form Penerima & Alamat */}
            <div className="mt-5 space-y-4 pt-2 border-t border-line/60">
              <div>
                <label className="block text-[13px] font-semibold text-ink" htmlFor="nama">
                  Nama Penerima / Pemesan <span className="text-danger">*</span>
                </label>
                <input
                  id="nama"
                  required
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Contoh: Budi Santoso"
                  value={customer.name}
                  onBlur={() => setNameTouched(true)}
                  onChange={(e) => {
                    setCustomer({ name: e.target.value });
                    if (nameTouched) setNameTouched(false);
                  }}
                  aria-invalid={nameError || undefined}
                  className={`mt-1.5 h-11 w-full rounded-tag border bg-surface px-3.5 text-[14px] ${
                    nameError ? 'border-danger focus:border-danger' : 'border-field focus:border-brand-text'
                  } outline-none`}
                />
                {nameError && (
                  <p role="alert" className="mt-1 text-[12px] font-medium text-danger">
                    Nama pemesan wajib diisi.
                  </p>
                )}
              </div>

              {customer.fulfilment === 'ambil' ? (
                <div>
                  <label className="block text-[13px] font-semibold text-ink" htmlFor="jam-ambil">
                    Jam Pengambilan di Toko (Opsional)
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <select
                      id="jam-ambil"
                      value={pickupTime}
                      onChange={(e) => setCustomer({ pickupTime: e.target.value })}
                      className="h-11 min-w-0 flex-1 rounded-tag border border-field bg-surface px-3 text-[14px] outline-none focus:border-brand-text"
                    >
                      <option value="">Kapan saja (saat toko buka)</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          Pukul {formatTime(slot)} WITA
                        </option>
                      ))}
                    </select>
                    {pickupTime && (
                      <button
                        type="button"
                        onClick={() => setCustomer({ pickupTime: '' })}
                        className="tap shrink-0 text-[13px] font-medium text-muted underline hover:text-ink"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted">{hoursInfo}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-ink">
                      Alamat Pengantaran <span className="text-danger">*</span>
                    </label>

                    {customer.deliveryAddress ? (
                      /* Card Alamat yang Dipilih ala Shopee/Tokopedia */
                      <div className="mt-1.5 rounded-tag border border-line bg-surface p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={16} weight="fill" className="text-brand shrink-0" />
                              <span className="font-bold text-[14px] text-ink truncate">
                                {selectedBuilding || 'Alamat yang Dipilih'}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] text-muted leading-relaxed">
                              {customer.deliveryAddress}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowMapModal(true)}
                            className="btn btn-secondary h-8.5 px-3 text-[12px] font-semibold shrink-0"
                          >
                            Ubah Titik
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Tombol Buka Peta jika alamat belum ada */
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="btn btn-secondary w-full h-11 flex items-center justify-center gap-2 border-dashed border-2 text-[13px] font-semibold text-brand-text"
                        >
                          <MapPin size={18} weight="bold" />
                          Pilih Titik Lokasi di Peta (Real-Time)
                        </button>
                      </div>
                    )}

                    {addressError && (
                      <p role="alert" className="mt-1 text-[12px] font-medium text-danger">
                        Alamat pengantaran wajib ditentukan.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-ink" htmlFor="catatan-antar">
                      Patokan / Catatan Alamat (Opsional)
                    </label>
                    <input
                      id="catatan-antar"
                      maxLength={200}
                      placeholder="Contoh: Blok Q No. 2, pagar hitam / titip di pos sekuriti"
                      value={customer.pickupNote}
                      onChange={(e) => setCustomer({ pickupNote: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-tag border border-field bg-surface px-3.5 text-[14px] outline-none focus:border-brand-text"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Pilihan Kurir Pengiriman (Tokopedia / Shopee Delivery Card Style) */}
          {isDelivery && (
            <div className="card rounded-[var(--radius-media)] p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Truck size={20} weight="bold" className="text-brand shrink-0" aria-hidden />
                  <h2 className="text-[16px] font-bold text-ink">Pilihan Kurir Pengiriman</h2>
                </div>
                {loadingRates && (
                  <span className="flex items-center gap-1 text-[12px] font-medium text-brand-text animate-pulse">
                    Menghitung tarif…
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {rates.map((r) => {
                  const isSelected =
                    customer.shippingCourier === r.courierName &&
                    customer.shippingService === r.serviceName;

                  const isGojek = r.courierCode === 'gojek';
                  const isGrab = r.courierCode === 'grab';

                  const badgeBg = isGojek
                    ? 'bg-[#00880C] text-white'
                    : isGrab
                      ? 'bg-[#00B14F] text-white'
                      : 'bg-brand text-white';

                  return (
                    <label
                      key={`${r.courierCode}-${r.serviceName}`}
                      className={`flex cursor-pointer items-center justify-between rounded-tag border p-3.5 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand-tint shadow-xs'
                          : 'border-field bg-surface hover:border-line-strong'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={isSelected}
                          onChange={() =>
                            setCustomer({
                              shippingCourier: r.courierName,
                              shippingService: r.serviceName,
                              shippingCost: r.price,
                            })
                          }
                          className="size-4.5 accent-[var(--color-brand)]"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${badgeBg}`}>
                              {isGojek ? 'GOSEND' : isGrab ? 'GRAB' : 'KURIR TOKO'}
                            </span>
                            <span className="font-bold text-[14px] text-ink">{r.courierName}</span>
                            <span className="text-[12px] text-muted">({r.serviceName})</span>
                          </div>
                          {r.duration && (
                            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                              <Motorcycle size={13} aria-hidden /> Estimasi tiba: {r.duration}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p className="price text-[15px] font-bold text-ink">{formatRupiah(r.price)}</p>
                        {r.isFallback && (
                          <span className="text-[10px] text-muted">Tarif Flat</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <p className="mt-3 text-[12px] text-muted">
                Kurir mengambil paket langsung dari Toko New Agung Jl. DR. Ratulangi No.52 Makassar dan mengantarkan ke alamat tujuan Anda.
              </p>
            </div>
          )}

          {/* Section 3: Daftar Barang Belanjaan */}
          <div className="card rounded-[var(--radius-media)] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[16px] font-bold text-ink">Daftar Produk ({lines.length} jenis)</h2>
              <Link href="/barang" className="text-[13px] font-semibold text-brand-text hover:underline">
                + Tambah Barang
              </Link>
            </div>

            <ul className="mt-3 divide-y divide-line">
              {lines.map((l) => {
                const problem = problems.get(key(l));
                return (
                  <li key={key(l)} className={`flex gap-3.5 py-3.5 ${problem ? 'bg-danger/5 p-2 rounded' : ''}`}>
                    <Link
                      href={`/barang/${l.slug}`}
                      tabIndex={-1}
                      aria-hidden
                      className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-white"
                    >
                      {l.image ? (
                        <Image src={l.image} alt="" fill sizes="64px" className="object-contain p-1" />
                      ) : (
                        <Package size={22} weight="thin" className="text-muted" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/barang/${l.slug}`} className="line-clamp-2 text-[14px] font-semibold text-ink hover:underline">
                            {l.name}
                          </Link>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {l.variantLabel && <span>{l.variantLabel} · </span>}
                            {formatRupiah(l.price)} / {l.unit}
                          </p>
                        </div>
                        <Price value={l.price * l.qty} className="text-[15px] font-bold text-ink shrink-0" />
                      </div>

                      {problem && (
                        <p className="mt-1 text-[12px] font-semibold text-danger">
                          {problem === 'habis' ? 'Stok produk ini habis' : 'Satuan ini tidak lagi tersedia'}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex h-9 items-center rounded-tag border border-field bg-surface">
                          <button
                            type="button"
                            className="grid h-full w-8 place-items-center rounded-l-tag hover:bg-sunken"
                            onClick={() => setQty(l.variantId, l.unit, l.qty - 1)}
                            aria-label={`Kurangi ${l.name}`}
                          >
                            <Minus size={14} weight="bold" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={l.qty}
                            min={1}
                            onChange={(e) => setQty(l.variantId, l.unit, Number(e.target.value) || 1)}
                            aria-label={`Jumlah ${l.name}`}
                            className="price h-full w-10 bg-transparent text-center text-[14px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            className="grid h-full w-8 place-items-center rounded-r-tag hover:bg-sunken"
                            onClick={() => setQty(l.variantId, l.unit, l.qty + 1)}
                            aria-label={`Tambah ${l.name}`}
                          >
                            <Plus size={14} weight="bold" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(l.variantId, l.unit)}
                          aria-label={`Hapus ${l.name}`}
                          className="tap flex items-center gap-1 text-[12px] text-muted hover:text-danger"
                        >
                          <Trash size={16} /> Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section 4: Metode Pembayaran */}
          <div className="card rounded-[var(--radius-media)] p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={20} weight="bold" className="text-brand shrink-0" aria-hidden />
                <h2 className="text-[16px] font-bold text-ink">Metode Pembayaran</h2>
              </div>
              {payDana && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[11px] font-bold text-[#108EE9]">
                  DANA Auto-Pay
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-2.5">
              {danaReady && (
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-tag border p-3.5 transition-all ${
                    payDana ? 'border-brand bg-brand-tint shadow-xs' : 'border-field bg-surface hover:border-line-strong'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="payment_method"
                      value="dana"
                      checked={payDana}
                      onChange={() => setCustomer({ paymentMethod: 'dana' })}
                      className="size-4.5 accent-[var(--color-brand)]"
                    />
                    <Wallet size={24} weight="bold" className="shrink-0 text-[#108EE9]" aria-hidden />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-ink">DANA (Bayar Langsung Online)</span>
                        <span className="rounded bg-[#108EE9] px-1.5 py-0.2 text-[10px] font-bold text-white">INSTAN</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        Bayar langsung via aplikasi/QRIS DANA. Pesanan otomatis lunas dan langsung disiapkan toko.
                      </p>
                    </div>
                  </div>
                </label>
              )}

              <label
                className={`flex cursor-pointer items-center justify-between rounded-tag border p-3.5 transition-all ${
                  !payDana ? 'border-brand bg-brand-tint shadow-xs' : 'border-field bg-surface hover:border-line-strong'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="payment_method"
                    value="wa"
                    checked={!payDana}
                    onChange={() => setCustomer({ paymentMethod: 'wa' })}
                    className="size-4.5 accent-[var(--color-brand)]"
                  />
                  <WhatsappLogo size={24} weight="bold" className="shrink-0 text-wa-text" aria-hidden />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-ink">Bayar di Tempat / Konfirmasi WhatsApp</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted">
                      Bayar tunai/QRIS saat ambil barang di toko atau transfer langsung saat konfirmasi via WhatsApp.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Honeypot anti-bot */}
          <div aria-hidden className="absolute -left-[9999px]">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {error && (
            <div role="alert" className="rounded-tag border border-danger/40 bg-danger/10 p-3.5 text-[13px] font-medium text-danger">
              {error}
            </div>
          )}
        </form>

        {/* Kolom Kanan: Ringkasan Belanja (Sticky ala Tokopedia/Shopee) */}
        <div className="h-fit lg:sticky lg:top-24 space-y-4">
          <div className="card rounded-[var(--radius-media)] p-5 sm:p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-ink border-b border-line pb-3">Ringkasan Belanja</h2>

            <div className="mt-4 space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between text-muted">
                <span>Total Harga ({lines.length} jenis barang)</span>
                <span className="text-ink font-medium">{formatRupiah(itemsTotal)}</span>
              </div>

              {isDelivery && (
                <div className="flex items-center justify-between text-muted">
                  <div className="min-w-0">
                    <span>Ongkos Kirim</span>
                    <span className="block text-[11px] text-brand-text truncate">
                      {customer.shippingCourier ? `${customer.shippingCourier} (${customer.shippingService})` : 'Kurir'}
                    </span>
                  </div>
                  <span className="text-ink font-medium shrink-0 ml-2">
                    {formatRupiah(shippingCost)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted">
                <span>Biaya Layanan & Aplikasi</span>
                <span className="font-bold text-ok text-[12px] uppercase">GRATIS</span>
              </div>

              <hr className="receipt-rule my-3.5" />

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="block text-[15px] font-bold text-ink">Total Tagihan</span>
                  <span className="block text-[11px] text-muted">Termasuk ongkir dan pajak</span>
                </div>
                <Price value={grandTotal} className="text-[26px] font-extrabold text-brand sm:text-[28px]" />
              </div>
            </div>

            <div className="mt-6">
              {payDana ? (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={busy}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Wallet size={22} weight="bold" aria-hidden />
                  {busy ? 'Membuka DANA…' : `Bayar ${formatRupiah(grandTotal)} dengan DANA`}
                </button>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={busy}
                  className="btn btn-wa btn-lg w-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <WhatsappLogo size={22} weight="bold" aria-hidden />
                  {busy ? 'Menyimpan pesanan…' : 'Kirim Pesanan via WhatsApp'}
                </button>
              )}
              <p className="mt-2.5 text-center text-[11px] text-muted">
                {payDana
                  ? '🔒 Anda akan diarahkan ke halaman pembayaran resmi DANA Indonesia.'
                  : '📲 Rincian lengkap pesanan akan otomatis terkirim ke WhatsApp toko.'}
              </p>
            </div>
          </div>

          {/* Badge Kepercayaan Tokopedia Style */}
          <div className="card rounded-[var(--radius-media)] p-4 text-[12px] space-y-2.5 bg-sunken/40">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} weight="fill" className="text-ok shrink-0 mt-0.5" />
              <p className="text-muted">
                <strong className="text-ink font-semibold">Jaminan Transaksi Aman:</strong> Data dan rincian belanja Anda tersimpan langsung di sistem toko.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Storefront size={18} weight="fill" className="text-brand shrink-0 mt-0.5" />
              <p className="text-muted">
                <strong className="text-ink font-semibold">Toko Fisik Resmi:</strong> Toko New Agung, Jl. DR. Ratulangi No.52 Makassar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
