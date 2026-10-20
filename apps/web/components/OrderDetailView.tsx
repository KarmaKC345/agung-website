'use client';

import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  Package,
  Printer,
  ShoppingBag,
  Storefront,
  Truck,
  Wallet,
  WhatsappLogo,
  XCircle,
} from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  formatRupiah,
  ORDER_STATUS_LABEL,
  type CurrentPrice,
  type OrderStatus,
} from '@newagung/shared';
import { useShop, type CartLine } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { CenteredLoading } from './CenteredLoading';
import { OrderTimeline } from './OrderTimeline';
import { Price } from './Price';
import { PrintReceiptModal } from './PrintReceiptModal';

interface OrderItemDetail {
  variantId?: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  slug?: string;
  image?: string | null;
}

interface OrderDetail {
  id?: string;
  code: string;
  customerName: string;
  fulfilment: 'ambil' | 'antar';
  pickupNote?: string;
  status: OrderStatus;
  estimatedTotal: number;
  createdAt: string;
  paymentMethod?: 'wa' | 'dana';
  paymentStatus?: 'none' | 'pending' | 'paid' | 'failed' | 'expired';
  shippingCourier?: string;
  shippingService?: string;
  shippingCost?: number;
  deliveryAddress?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  items: OrderItemDetail[];
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Makassar',
});

const BANNER_CONFIG: Record<
  OrderStatus,
  { title: string; subtitle: string; bg: string; text: string; icon: typeof CheckCircle }
> = {
  baru: {
    title: 'Menunggu Konfirmasi',
    subtitle: 'Pesanan telah diterima toko dan sedang menunggu antrean staf.',
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    icon: Clock,
  },
  disiapkan: {
    title: 'Pesanan Sedang Diproses',
    subtitle: 'Staf Toko New Agung sedang mengemas barang pesanan Anda.',
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: Clock,
  },
  siap: {
    title: 'Siap Diambil / Dikirim',
    subtitle: 'Barang sudah selesai dikemas dan siap dijemput kurir atau diambil.',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: Truck,
  },
  selesai: {
    title: 'Pesanan Selesai',
    subtitle: 'Terima kasih telah berbelanja di Toko New Agung Makassar!',
    bg: 'bg-green-500/10 border-green-500/30',
    text: 'text-green-600 dark:text-green-400',
    icon: CheckCircle,
  },
  batal: {
    title: 'Pesanan Dibatalkan',
    subtitle: 'Pesanan ini telah dibatalkan.',
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    icon: XCircle,
  },
};

/**
 * Halaman rincian pesanan ala Shopee / Tokopedia / TikTok Shop.
 * Menampilkan tracking progress, data kurir & alamat, daftar produk, dan bukti pembayaran.
 */
export function OrderDetailView({ code }: { code: string }) {
  const router = useRouter();
  const history = useShop((s) => s.history);
  const add = useShop((s) => s.add);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      // 1. Coba ambil data lengkap dari server database
      try {
        const res = await fetch(`${API_URL}/api/orders/${encodeURIComponent(code)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as OrderDetail;
          if (active) {
            setOrder(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Fallback: ambil dari riwayat lokal di browser (localStorage)
      const local = history.find((h) => h.code === code);
      if (local && active) {
        setOrder({
          code: local.code,
          customerName: 'Pelanggan',
          fulfilment: local.deliveryAddress || local.shippingCourier ? 'antar' : 'ambil',
          status: 'baru',
          estimatedTotal: local.total,
          createdAt: local.createdAt,
          paymentMethod: local.paymentMethod,
          shippingCourier: local.shippingCourier,
          shippingService: local.shippingService,
          shippingCost: local.shippingCost,
          deliveryAddress: local.deliveryAddress,
          items: local.lines.map((l) => ({
            variantId: l.variantId,
            name: l.name,
            unit: l.unit,
            price: l.price,
            qty: l.qty,
            slug: l.slug,
            image: l.image,
          })),
        });
      }

      if (active) setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [code, history]);

  function copyCode() {
    if (!order) return;
    void navigator.clipboard.writeText(order.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReorder() {
    if (!order) return;
    setReorderBusy(true);
    try {
      const itemsToCheck = order.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, unit: i.unit }));
      if (itemsToCheck.length > 0) {
        const res = await fetch(`${API_URL}/api/variants/prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsToCheck }),
        });
        if (res.ok) {
          const current = (await res.json()) as CurrentPrice[];
          order.items.forEach((item, idx) => {
            const c = current[idx];
            if (c && c.price !== null && c.stockStatus !== 'habis') {
              add(
                {
                  variantId: item.variantId || '',
                  productId: '',
                  variantLabel: '',
                  name: item.name,
                  unit: item.unit,
                  price: c.price,
                  slug: item.slug || '',
                  image: item.image || null,
                },
                item.qty,
              );
            }
          });
          router.push('/keranjang');
          return;
        }
      }

      // Default fallback reorder
      order.items.forEach((item) => {
        add(
          {
            variantId: item.variantId || '',
            productId: '',
            variantLabel: '',
            name: item.name,
            unit: item.unit,
            price: item.price,
            slug: item.slug || '',
            image: item.image || null,
          },
          item.qty,
        );
      });
      router.push('/keranjang');
    } finally {
      setReorderBusy(false);
    }
  }

  if (loading) return <CenteredLoading text="Memuat rincian pesanan…" />;

  if (!order) {
    return (
      <div className="card mx-auto max-w-lg rounded-[var(--radius-media)] p-8 text-center space-y-4">
        <Package size={48} weight="thin" className="mx-auto text-muted" />
        <h1 className="text-[20px] font-bold text-ink">Pesanan Tidak Ditemukan</h1>
        <p className="text-[14px] text-muted leading-relaxed">
          Kode pesanan <b>{code}</b> tidak ditemukan di perangkat ini atau server toko.
        </p>
        <Link href="/favorit?tab=riwayat" className="btn btn-primary inline-flex">
          Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  const banner = BANNER_CONFIG[order.status] ?? BANNER_CONFIG.baru;
  const BannerIcon = banner.icon;
  const isDelivery = order.fulfilment === 'antar' || Boolean(order.deliveryAddress);
  const itemsSubtotal = order.items.reduce((acc, it) => acc + it.price * it.qty, 0);

  return (
    <div className="space-y-4">
      {/* Top Nav Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/favorit?tab=riwayat"
          className="tap inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" /> Kembali ke Riwayat Pesanan
        </Link>
        <span className="text-[12px] text-muted">Toko New Agung Makassar</span>
      </div>

      {/* 1. Header Banner Status Pesanan ala Shopee/Tokopedia */}
      <div className={`rounded-[var(--radius-media)] border p-4 sm:p-5 flex items-center justify-between gap-4 ${banner.bg}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[17px] sm:text-[19px] font-bold ${banner.text}`}>{banner.title}</span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">{banner.subtitle}</p>
        </div>
        <div className={`grid size-12 shrink-0 place-items-center rounded-full bg-surface shadow-xs ${banner.text}`}>
          <BannerIcon size={28} weight="fill" />
        </div>
      </div>

      {/* 2. Card Timeline Pelacakan & Nomor Pesanan */}
      <div className="card rounded-[var(--radius-media)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Nomor Pesanan</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[16px] font-bold text-ink select-all">{order.code}</span>
              <button
                type="button"
                onClick={copyCode}
                className="tap inline-flex items-center gap-1 rounded bg-sunken px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-ink"
                title="Salin kode pesanan"
              >
                {copied ? <Check size={12} weight="bold" className="text-ok" /> : <Copy size={12} />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Waktu Pemesanan</span>
            <p className="text-[13px] text-ink font-medium mt-0.5">{dateFmt.format(new Date(order.createdAt))}</p>
          </div>
        </div>

        {/* Visual Stepper Timeline */}
        <div className="pt-1">
          <OrderTimeline status={order.status} fulfilment={isDelivery ? 'antar' : 'ambil'} />
        </div>
      </div>

      {/* 3. Card Informasi Pengiriman / Pengantaran Kurir */}
      <div className="card rounded-[var(--radius-media)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          {isDelivery ? (
            <Truck size={20} weight="bold" className="text-brand shrink-0" />
          ) : (
            <Storefront size={20} weight="bold" className="text-brand shrink-0" />
          )}
          <h2 className="text-[15px] font-bold text-ink">
            {isDelivery ? 'Informasi Pengantaran Kurir' : 'Informasi Pengambilan di Toko'}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-[13px]">
          <div>
            <span className="text-[11px] text-muted uppercase font-semibold">Layanan Kurir / Pengambilan</span>
            <p className="font-bold text-ink text-[14px] mt-0.5">
              {isDelivery ? (
                <>
                  {order.shippingCourier || 'Kurir Pengantaran'}
                  {order.shippingService ? ` (${order.shippingService})` : ''}
                </>
              ) : (
                'Ambil Sendiri di Toko New Agung'
              )}
            </p>
            {isDelivery && order.shippingCost !== undefined && (
              <span className="text-[12px] text-brand-text font-medium">
                Ongkir: {formatRupiah(order.shippingCost)}
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-muted uppercase font-semibold">
              {isDelivery ? 'Alamat Tujuan' : 'Lokasi Toko'}
            </span>
            {isDelivery ? (
              <div className="mt-0.5 space-y-0.5">
                <p className="font-bold text-ink">{order.customerName}</p>
                <p className="text-muted leading-relaxed">{order.deliveryAddress || 'Alamat tidak tertera'}</p>
                {order.pickupNote && (
                  <p className="text-[12px] text-brand-text">Catatan/Patokan: {order.pickupNote}</p>
                )}
              </div>
            ) : (
              <div className="mt-0.5 space-y-0.5">
                <p className="font-bold text-ink">Toko New Agung Makassar</p>
                <p className="text-muted">Jl. DR. Ratulangi No.52, Makassar (Buka 08.00 - 22.00 WITA)</p>
                {order.pickupNote && <p className="text-[12px] text-brand-text">Jadwal: {order.pickupNote}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Card Daftar Produk Belanjaan */}
      <div className="card rounded-[var(--radius-media)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} weight="bold" className="text-brand shrink-0" />
            <h2 className="text-[15px] font-bold text-ink">Rincian Produk Belanjaan ({order.items.length} jenis)</h2>
          </div>
          <span className="text-[12px] text-muted">Toko Fisik Resmi</span>
        </div>

        <ul className="divide-y divide-line">
          {order.items.map((it, idx) => {
            const href = it.slug ? `/barang/${it.slug}` : `/cari?q=${encodeURIComponent(it.name)}`;
            return (
              <li key={`${it.name}-${idx}`} className="flex gap-3.5 py-3">
                <Link
                  href={href}
                  className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-white"
                >
                  {it.image ? (
                    <Image src={it.image} alt={it.name} fill sizes="64px" className="object-contain p-1" />
                  ) : (
                    <Package size={24} weight="thin" className="text-muted" />
                  )}
                </Link>

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={href} className="text-[14px] font-semibold text-ink hover:text-brand-text hover:underline line-clamp-2">
                      {it.name}
                    </Link>
                    <p className="text-[12px] text-muted mt-0.5">
                      {it.qty} {it.unit} × {formatRupiah(it.price)}
                    </p>
                  </div>
                  <p className="price text-[14px] font-bold text-ink self-end">
                    {formatRupiah(it.price * it.qty)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 5. Card Rincian Pembayaran */}
      <div className="card rounded-[var(--radius-media)] p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <CreditCard size={20} weight="bold" className="text-brand shrink-0" />
          <h2 className="text-[15px] font-bold text-ink">Rincian Pembayaran</h2>
        </div>

        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between text-muted">
            <span>Metode Pembayaran</span>
            <div className="flex items-center gap-1.5">
              {order.paymentMethod === 'dana' ? (
                <>
                  <Wallet size={16} className="text-[#108EE9]" weight="bold" />
                  <span className="font-bold text-ink">DANA Payment Gateway</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                      order.paymentStatus === 'paid'
                        ? 'bg-ok text-white'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? 'Lunas' : 'Menunggu Bayar'}
                  </span>
                </>
              ) : (
                <>
                  <WhatsappLogo size={16} className="text-wa-text" weight="bold" />
                  <span className="font-bold text-ink">Bayar di Tempat / WhatsApp</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-muted">
            <span>Subtotal Harga Produk</span>
            <span className="text-ink font-medium">{formatRupiah(itemsSubtotal)}</span>
          </div>

          {isDelivery && (
            <div className="flex items-center justify-between text-muted">
              <span>Ongkos Kirim ({order.shippingCourier || 'Kurir'})</span>
              <span className="text-ink font-medium">{formatRupiah(order.shippingCost || 0)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-muted">
            <span>Biaya Layanan & Aplikasi</span>
            <span className="font-bold text-ok uppercase text-[11px]">GRATIS</span>
          </div>

          <hr className="receipt-rule my-2.5" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[15px] font-bold text-ink">Total Pembayaran</span>
            <Price value={order.estimatedTotal} className="text-[22px] font-extrabold text-brand sm:text-[24px]" />
          </div>
        </div>
      </div>

      {/* 6. Action Footer Bar */}
      <div className="card rounded-[var(--radius-media)] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <a
            href={`https://wa.me/6282348485101?text=${encodeURIComponent(
              `Halo Toko New Agung, saya ingin menanyakan rincian pesanan saya dengan nomor ${order.code}.`,
            )}`}
            target="_blank"
            rel="noopener"
            className="btn btn-secondary flex-1 sm:flex-initial h-11 text-[14px] font-semibold"
          >
            <WhatsappLogo size={20} weight="bold" className="text-wa-text" />
            Hubungi Toko via WhatsApp
          </a>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="btn btn-secondary flex-1 sm:flex-initial h-11 text-[14px] font-semibold flex items-center justify-center gap-1.5"
            title="Cetak struk nota belanja"
          >
            <Printer size={18} weight="bold" />
            Cetak Nota / Struk
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/barang" className="btn btn-secondary flex-1 sm:flex-initial h-11 text-[14px]">
            Lanjut Belanja
          </Link>
          <button
            type="button"
            disabled={reorderBusy}
            onClick={handleReorder}
            className="btn btn-primary flex-1 sm:flex-initial h-11 text-[14px] font-bold shadow-md"
          >
            {reorderBusy ? 'Menyiapkan…' : 'Beli Lagi'}
          </button>
        </div>
      </div>

      {showPrintModal && (
        <PrintReceiptModal
          order={{
            code: order.code,
            customerName: order.customerName,
            fulfilment: order.fulfilment,
            pickupNote: order.pickupNote,
            status: order.status,
            estimatedTotal: order.estimatedTotal,
            createdAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shippingCourier: order.shippingCourier,
            shippingService: order.shippingService,
            shippingCost: order.shippingCost,
            deliveryAddress: order.deliveryAddress,
            items: order.items,
          }}
          initialMode="receipt"
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
