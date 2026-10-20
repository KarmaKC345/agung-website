'use client';

import { Check, Minus, Plus, ShoppingBag, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRupiah, STOCK_LABEL, type ProductDetail, type ProductSummary } from '@newagung/shared';
import { useShop } from '@/lib/cart';
import { API_URL } from '@/lib/config';
import { useToast } from '@/lib/toast';
import { CenteredLoading } from './CenteredLoading';
import { Price } from './Price';

interface Props {
  product: ProductSummary;
  onClose: () => void;
}

export function VariantPickerSheet({ product, onClose }: Props) {
  const router = useRouter();
  const add = useShop((s) => s.add);

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vIdx, setVIdx] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Kunci scroll body saat sheet terbuka & dukung Escape
  useEffect(() => {
    setMounted(true);
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

  // Fetch data lengkap varian dari API
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/products/${product.slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Gagal memuat varian produk');
        return r.json();
      })
      .then((d: ProductDetail) => {
        if (!active) return;
        setDetail(d);
        // Pilih varian pertama yang ada stok
        const firstAvail = d.variants.findIndex((v) => v.stockStatus !== 'habis');
        const defaultIdx = firstAvail >= 0 ? firstAvail : 0;
        setVIdx(defaultIdx);
        const defVar = d.variants[defaultIdx];
        if (defVar && defVar.prices.length > 0) {
          const promoUnit = defVar.prices.find((p) => p.originalPrice)?.unit;
          setUnit(promoUnit || defVar.prices[0]!.unit);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Gagal memuat produk');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product.slug]);

  const activeVariant = detail?.variants[vIdx];
  const activePrice = useMemo(() => {
    if (!activeVariant) return null;
    return activeVariant.prices.find((p) => p.unit === unit) ?? activeVariant.prices[0];
  }, [activeVariant, unit]);

  const isOutOfStock = activeVariant?.stockStatus === 'habis';
  const hasPromo = activePrice?.originalPrice && activePrice.originalPrice > activePrice.price;
  const discountPercent = hasPromo
    ? Math.round((1 - activePrice!.price / activePrice!.originalPrice!) * 100)
    : 0;

  function pickVariant(idx: number) {
    setVIdx(idx);
    const nextVar = detail?.variants[idx];
    if (nextVar && !nextVar.prices.some((p) => p.unit === unit)) {
      setUnit(nextVar.prices[0]?.unit || 'pcs');
    }
  }

  function handleAddToCart(buyDirect = false) {
    if (!detail || !activeVariant || !activePrice || isOutOfStock) return;
    setSubmitting(true);

    add(
      {
        variantId: activeVariant.id,
        productId: detail.id,
        slug: detail.slug,
        name: detail.name,
        variantLabel: activeVariant.label,
        unit: activePrice.unit,
        price: activePrice.price,
        image: detail.images[0] ?? product.image,
      },
      qty,
    );

    useToast.getState().show({
      title: detail.name,
      cart: { qty, unit: activePrice.unit },
    });

    onClose();

    if (buyDirect) {
      router.push('/keranjang');
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pilih varian ${product.name}`}
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col w-full max-h-[85vh] sm:max-w-md rounded-t-[20px] sm:rounded-[20px] border border-line bg-surface shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="tap absolute top-3.5 right-3.5 z-10 grid size-8 place-items-center rounded-full bg-sunken text-muted hover:text-ink"
        >
          <X size={18} weight="bold" />
        </button>

        {loading ? (
          <div className="py-16">
            <CenteredLoading text="Memuat varian produk…" />
          </div>
        ) : error || !detail || !activeVariant || !activePrice ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-danger font-medium">{error || 'Gagal menampilkan varian'}</p>
            <button type="button" onClick={onClose} className="btn btn-secondary text-sm">
              Tutup
            </button>
          </div>
        ) : (
          <>
            {/* 1. Header Produk: Foto Thumbnail, Harga, Diskon, Stok (Gaya Shopee) */}
            <div className="flex gap-3.5 p-4 border-b border-line bg-surface">
              <div className="relative size-22 shrink-0 overflow-hidden rounded-[10px] border border-line bg-white">
                <Image
                  src={detail.images[0] || product.image || '/icon.svg'}
                  alt={detail.name}
                  fill
                  sizes="88px"
                  className="object-contain p-1.5"
                />
              </div>

              <div className="min-w-0 flex-1 pr-6 flex flex-col justify-center">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <Price value={activePrice.price} className="text-[22px] font-extrabold text-brand" />
                  <span className="text-[12px] text-muted">/{activePrice.unit}</span>
                </div>

                {hasPromo && (
                  <p className="flex items-center gap-1.5 text-[12px] mt-0.5">
                    <span className="price rounded-[4px] bg-signal-tint px-1 py-0.2 text-[11px] font-bold text-signal-text">
                      {discountPercent}%
                    </span>
                    <s className="text-muted tabular-nums">
                      {formatRupiah(activePrice.originalPrice!)}
                    </s>
                  </p>
                )}

                <p className="text-[12px] mt-1 text-muted truncate">
                  Stok:{' '}
                  <span
                    className={`font-semibold ${
                      isOutOfStock
                        ? 'text-danger'
                        : activeVariant.stockStatus === 'sedikit'
                          ? 'text-warn'
                          : 'text-ok'
                    }`}
                  >
                    {STOCK_LABEL[activeVariant.stockStatus]}
                  </span>
                  {activeVariant.label && (
                    <span className="text-ink font-medium"> · {activeVariant.label}</span>
                  )}
                </p>
              </div>
            </div>

            {/* 2. Body Pilihan Varian & Satuan (Scrollable) */}
            <div className="overflow-y-auto p-4 space-y-4 max-h-[50vh]">
              {/* Pilihan Varian / Warna */}
              {detail.variants.length > 1 && (
                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-2">
                    Pilihan Varian / Warna
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {detail.variants.map((v, idx) => {
                      const isSelected = idx === vIdx;
                      const isOut = v.stockStatus === 'habis';
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={isOut}
                          onClick={() => pickVariant(idx)}
                          className={`tap flex items-center gap-1.5 rounded-tag border px-3 py-1.5 text-[13px] font-medium transition-all ${
                            isSelected
                              ? 'border-brand bg-brand-tint text-brand-text shadow-xs font-bold'
                              : isOut
                                ? 'border-line/60 bg-sunken text-muted/50 line-through cursor-not-allowed'
                                : 'border-field bg-surface text-ink hover:border-line-strong'
                          }`}
                        >
                          {v.colorHex && (
                            <span
                              className="size-3.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: v.colorHex }}
                            />
                          )}
                          <span>{v.label || `Varian ${idx + 1}`}</span>
                          {isSelected && <Check size={14} weight="bold" className="text-brand-text" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pilihan Satuan Harga (pcs / lusin / pak / rim) */}
              {activeVariant.prices.length > 1 && (
                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-2">
                    Pilih Satuan
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeVariant.prices.map((p) => {
                      const isSelected = p.unit === unit;
                      return (
                        <button
                          key={p.unit}
                          type="button"
                          onClick={() => setUnit(p.unit)}
                          className={`tap flex items-center gap-1.5 rounded-tag border px-3 py-1.5 text-[13px] font-medium transition-all ${
                            isSelected
                              ? 'border-brand bg-brand-tint text-brand-text shadow-xs font-bold'
                              : 'border-field bg-surface text-ink hover:border-line-strong'
                          }`}
                        >
                          <span className="capitalize">{p.unit}</span>
                          <span className="text-[11px] text-muted">({formatRupiah(p.price)})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stepper Jumlah */}
              <div className="flex items-center justify-between pt-1 border-t border-line/60">
                <div>
                  <span className="block text-[13px] font-semibold text-ink">Jumlah Pembelian</span>
                  <span className="block text-[11px] text-muted">Subtotal: {formatRupiah(activePrice.price * qty)}</span>
                </div>

                <div className="flex h-9 items-center rounded-tag border border-field bg-surface">
                  <button
                    type="button"
                    disabled={qty <= 1 || isOutOfStock}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Kurangi jumlah"
                    className="grid h-full w-8 place-items-center rounded-l-tag hover:bg-sunken disabled:opacity-40"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <span className="price h-full w-10 grid place-items-center text-center text-[14px] font-bold">
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Tambah jumlah"
                    className="grid h-full w-8 place-items-center rounded-r-tag hover:bg-sunken disabled:opacity-40"
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Tombol Aksi di Bawah (Shopee Style) */}
            <div className="border-t border-line bg-surface p-3.5 flex gap-2">
              <button
                type="button"
                disabled={isOutOfStock || submitting}
                onClick={() => handleAddToCart(false)}
                className="btn btn-secondary flex-1 h-11 text-[13.5px] font-bold flex items-center justify-center gap-1.5"
              >
                <Plus size={16} weight="bold" />
                Keranjang
              </button>

              <button
                type="button"
                disabled={isOutOfStock || submitting}
                onClick={() => handleAddToCart(true)}
                className="btn btn-primary flex-1 h-11 text-[13.5px] font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <ShoppingBag size={16} weight="bold" />
                Beli Langsung
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
