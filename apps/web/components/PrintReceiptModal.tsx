'use client';

import { Barcode, Check, Copy, Printer, Tag, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { formatRupiah } from '@newagung/shared';

export interface PrintableOrder {
  code: string;
  customerName: string;
  fulfilment: 'ambil' | 'antar';
  pickupNote?: string | null;
  status?: string;
  estimatedTotal: number;
  createdAt: string;
  paymentMethod?: 'wa' | 'dana';
  paymentStatus?: 'none' | 'pending' | 'paid' | 'failed' | 'expired';
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingCost?: number | null;
  deliveryAddress?: string | null;
  items: Array<{
    name: string;
    unit: string;
    price: number;
    qty: number;
  }>;
}

interface Props {
  order: PrintableOrder;
  initialMode?: 'receipt' | 'label';
  onClose: () => void;
}

const timeFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Makassar',
});

// Barcode SVG sederhana untuk label pengiriman
function BarcodeSvg({ text }: { text: string }) {
  // Pola garis vertikal deterministik berdasarkan karakter
  const bars = text.split('').flatMap((char, i) => {
    const code = char.charCodeAt(0);
    return [
      (code % 3) + 1.5,
      ((code >> 1) % 2) + 1,
      ((code >> 2) % 3) + 1.5,
      ((code >> 3) % 2) + 1,
    ];
  });

  return (
    <div className="flex flex-col items-center">
      <svg className="h-10 w-56" viewBox="0 0 160 30" preserveAspectRatio="none">
        {bars.map((w, idx) => {
          const x = idx * 2.5;
          if (idx % 2 === 0) {
            return <rect key={idx} x={x} y="0" width={w} height="30" fill="currentColor" />;
          }
          return null;
        })}
      </svg>
      <span className="font-mono text-[11px] font-bold tracking-widest text-black mt-0.5">
        *{text}*
      </span>
    </div>
  );
}

export function PrintReceiptModal({ order, initialMode = 'receipt', onClose }: Props) {
  const isDelivery = order.fulfilment === 'antar' || Boolean(order.deliveryAddress);
  const [mode, setMode] = useState<'receipt' | 'label'>(
    initialMode === 'label' && isDelivery ? 'label' : 'receipt',
  );
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [copied, setCopied] = useState(false);

  // Kunci scroll body saat modal buka + dukung Escape
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const summary = [
      `TOKO NEW AGUNG MAKASSAR`,
      `Pesanan: ${order.code}`,
      `Pelanggan: ${order.customerName}`,
      `Layanan: ${isDelivery ? `Diantar (${order.shippingCourier || 'Kurir'})` : 'Ambil di Toko'}`,
      order.deliveryAddress ? `Alamat: ${order.deliveryAddress}` : '',
      `Total: ${formatRupiah(order.estimatedTotal)} (${order.paymentMethod === 'dana' ? 'DANA Lunas' : 'WA/Di Toko'})`,
      `Item:`,
      ...order.items.map((it) => `- ${it.qty} ${it.unit} ${it.name} (${formatRupiah(it.price * it.qty)})`),
    ].filter(Boolean).join('\n');

    void navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const itemsSubtotal = order.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const shippingCost = order.shippingCost || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cetak Struk dan Label Pengiriman"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs"
    >
      <div className="flex flex-col w-full max-w-xl max-h-[92vh] rounded-[var(--radius-media)] border border-line bg-surface shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 sm:px-5 bg-surface">
          <div className="flex items-center gap-2">
            <Printer size={20} weight="bold" className="text-brand" />
            <h2 className="text-[15px] font-bold text-ink">Cetak Struk & Label Paket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="tap grid size-9 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Toolbar Pengaturan Mode & Kertas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-sunken/40 px-4 py-2.5 text-[13px]">
          {/* Tabs Mode */}
          <div className="flex rounded-tag border border-field bg-surface p-1 font-semibold">
            <button
              type="button"
              onClick={() => setMode('receipt')}
              className={`flex items-center gap-1.5 rounded px-3 py-1 transition-colors ${
                mode === 'receipt' ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <Printer size={15} weight="bold" /> Struk Thermal Kasir
            </button>
            {isDelivery && (
              <button
                type="button"
                onClick={() => setMode('label')}
                className={`flex items-center gap-1.5 rounded px-3 py-1 transition-colors ${
                  mode === 'label' ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                <Tag size={15} weight="bold" /> Label Paket Kurir
              </button>
            )}
          </div>

          {/* Opsi Lebar Kertas (untuk struk) */}
          {mode === 'receipt' && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <span>Lebar Roll:</span>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`rounded border px-2 py-0.5 font-bold ${
                  paperWidth === '80mm' ? 'border-brand bg-brand-tint text-brand-text' : 'border-field bg-surface text-muted'
                }`}
              >
                80 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`rounded border px-2 py-0.5 font-bold ${
                  paperWidth === '58mm' ? 'border-brand bg-brand-tint text-brand-text' : 'border-field bg-surface text-muted'
                }`}
              >
                58 mm
              </button>
            </div>
          )}
        </div>

        {/* Preview Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-sunken/30 flex justify-center">
          {/* Wadah yang dicetak via @media print */}
          <div id="printable-thermal-area">
            {mode === 'receipt' ? (
              /* ================= STRUK THERMAL KASIR ================= */
              <div
                style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
                className="bg-white text-black p-4 font-mono text-[11px] leading-relaxed border border-dashed border-gray-300 shadow-md select-text"
              >
                {/* Toko Header */}
                <div className="text-center space-y-0.5 pb-2">
                  <p className="text-[14px] font-extrabold tracking-wider">TOKO NEW AGUNG</p>
                  <p className="text-[10px]">Jl. DR. Ratulangi No.52, Makassar</p>
                  <p className="text-[10px]">Telp: 0411-850555 · WA: 0823-4848-5101</p>
                </div>

                <div className="border-t border-dashed border-black my-1.5" />

                {/* Metadata Pesanan */}
                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between">
                    <span>No. Nota:</span>
                    <span className="font-bold">{order.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{timeFmt.format(new Date(order.createdAt))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-bold truncate max-w-[180px]">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layanan:</span>
                    <span>{isDelivery ? `Diantar (${order.shippingCourier || 'Kurir'})` : 'Ambil di Toko'}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-1.5" />

                {/* Item List */}
                <div className="space-y-1 py-1">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-bold">{it.name}</p>
                      <div className="flex justify-between text-[10px] pl-2 text-gray-800">
                        <span>
                          {it.qty} {it.unit} × {formatRupiah(it.price)}
                        </span>
                        <span>{formatRupiah(it.price * it.qty)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-black my-1.5" />

                {/* Kalkulasi Total */}
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(itemsSubtotal)}</span>
                  </div>
                  {isDelivery && (
                    <div className="flex justify-between">
                      <span>Ongkir:</span>
                      <span>{formatRupiah(shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px] font-extrabold pt-1 border-t border-dotted border-gray-400">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(order.estimatedTotal)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Status Pembayaran */}
                <div className="text-center py-1 bg-gray-100 rounded">
                  <p className="text-[10px] uppercase font-bold tracking-wider">
                    {order.paymentMethod === 'dana'
                      ? order.paymentStatus === 'paid'
                        ? '★ LUNAS (DANA PAYMENT GATEWAY) ★'
                        : 'MENUNGGU PEMBAYARAN DANA'
                      : 'PEMBAYARAN: TUNAI / VIA WHATSAPP'}
                  </p>
                </div>

                {/* Pesan Penutup */}
                <div className="text-center text-[9.5px] text-gray-700 pt-3 space-y-0.5">
                  <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian.</p>
                  <p className="font-bold pt-1">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
                </div>
              </div>
            ) : (
              /* ================= LABEL PENGIRIMAN PAKET ================= */
              <div
                style={{ width: '380px' }}
                className="bg-white text-black p-4 font-sans text-[12px] leading-tight border-2 border-black rounded shadow-md select-text"
              >
                {/* Header Kurir & Toko */}
                <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                  <div>
                    <span className="inline-block bg-black text-white px-2 py-0.5 text-[12px] font-extrabold uppercase tracking-wide rounded-xs">
                      {order.shippingCourier || 'KURIR PENGANTARAN'}
                    </span>
                    <p className="text-[10px] text-gray-700 mt-1">
                      {order.shippingService || 'Layanan Instant Makassar'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-[12px]">NEW AGUNG</p>
                    <p className="text-[9px] text-gray-600">Jl. DR. Ratulangi 52</p>
                  </div>
                </div>

                {/* Barcode & Nomor Resi / Pesanan */}
                <div className="py-2.5 text-center border-b-2 border-black bg-gray-50">
                  <BarcodeSvg text={order.code} />
                  <p className="text-[10px] text-gray-600 mt-1">
                    Ongkir: <b>{formatRupiah(shippingCost)}</b>
                  </p>
                </div>

                {/* Informasi Penerima (To) */}
                <div className="py-2.5 border-b border-black space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    Penerima:
                  </span>
                  <p className="font-extrabold text-[14px] leading-snug">{order.customerName}</p>
                  <p className="text-[12px] text-gray-800 leading-relaxed font-medium">
                    {order.deliveryAddress || 'Alamat tidak tertera'}
                  </p>
                  {order.pickupNote && (
                    <div className="mt-1 rounded bg-amber-50 p-1.5 border border-amber-200 text-[11px] text-amber-900">
                      <b>Patokan / Catatan:</b> {order.pickupNote}
                    </div>
                  )}
                </div>

                {/* Status Pelunasan Pembeli */}
                <div className="py-2 border-b border-black flex items-center justify-between bg-gray-50 px-2">
                  <span className="text-[11px] font-bold">Instruksi Kurir:</span>
                  <span
                    className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                      order.paymentMethod === 'dana' && order.paymentStatus === 'paid'
                        ? 'bg-black text-white'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {order.paymentMethod === 'dana' && order.paymentStatus === 'paid'
                      ? 'SUDAH LUNAS (JANGAN TAGIH PEMBELI)'
                      : 'TAGIH PEMBAYARAN KE PEMBELI'}
                  </span>
                </div>

                {/* Isi Paket Ringkas */}
                <div className="pt-2 text-[10.5px]">
                  <p className="font-bold text-gray-700 mb-1">Isi Paket ({order.items.length} item):</p>
                  <p className="text-gray-800 line-clamp-2">
                    {order.items.map((it) => `${it.qty} ${it.unit} ${it.name}`).join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Tombol Cetak & Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface p-4">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary h-10 text-[13px] font-semibold"
          >
            {copied ? <Check size={16} className="text-ok" weight="bold" /> : <Copy size={16} />}
            {copied ? 'Tersalin' : 'Salin Teks Nota'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary h-10 text-[13px] font-semibold"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary h-10 px-5 text-[14px] font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Printer size={18} weight="bold" />
              Cetak Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
