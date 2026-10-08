'use client';

import { Check, Minus, Plus, WhatsappLogo } from '@phosphor-icons/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatRupiah, STOCK_LABEL, type ProductDetail } from '@newagung/shared';
import { useShop } from '@/lib/cart';
import { Price } from './Price';

function Stepper({ qty, setQty, size = 'md' }: { qty: number; setQty: (fn: (q: number) => number) => void; size?: 'md' | 'sm' }) {
  const h = size === 'sm' ? 'h-10' : 'h-11';
  return (
    <div className={`flex ${h} w-fit items-center rounded-tag border border-field bg-surface`}>
      <button type="button" className="grid h-full w-10 place-items-center rounded-l-tag hover:bg-sunken disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi jumlah">
        <Minus size={16} weight="bold" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={9999}
        value={qty}
        onChange={(e) => {
          const v = Math.max(1, Math.min(9999, Number(e.target.value) || 1));
          setQty(() => v);
        }}
        aria-label="Jumlah"
        className="price h-full w-12 bg-transparent text-center text-[16px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className="grid h-full w-10 place-items-center rounded-r-tag hover:bg-sunken" onClick={() => setQty((q) => Math.min(9999, q + 1))} aria-label="Tambah jumlah">
        <Plus size={16} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Kolom info + kotak beli halaman barang. Pilih varian (warna/ukuran) dan satuan
 * (pcs/lusin/rim…), atur jumlah, lalu "+ Keranjang" atau "Beli langsung" (masuk keranjang
 * lalu langsung ke halaman keranjang). Di HP tombolnya menempel di bawah layar.
 */
export function ProductPurchase({
  product,
  head,
  waHref,
  children,
}: {
  product: ProductDetail;
  /** merek, nama, dan ringkasan di atas harga (dirender server) */
  head: React.ReactNode;
  waHref: string;
  /** detail di bawah pilihan (keterangan, info ambil di toko) */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const firstAvailable = product.variants.findIndex((v) => v.stockStatus !== 'habis');
  const [vIdx, setVIdx] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const variant = product.variants[vIdx];
  // satuan awal: satuan yang sedang promo bila ada, agar harga di kartu sama dengan di sini
  const [unit, setUnit] = useState(() => (variant?.prices.find((p) => p.originalPrice) ?? variant?.prices[0])?.unit ?? 'pcs');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const add = useShop((s) => s.add);

  const price = useMemo(() => variant?.prices.find((p) => p.unit === unit) ?? variant?.prices[0], [variant, unit]);
  if (!variant || !price) return null;

  const out = variant.stockStatus === 'habis';
  const hasChoice = product.variants.length > 1;
  const isColor = product.variants.every((v) => v.colorHex);
  const base = variant.prices[0]!;
  const discount = price.originalPrice ? Math.round((1 - price.price / price.originalPrice) * 100) : 0;
  const stockCls = out ? 'text-danger' : variant.stockStatus === 'sedikit' ? 'text-warn' : 'text-ok';

  function pickVariant(i: number) {
    setVIdx(i);
    const next = product.variants[i]!;
    if (!next.prices.some((p) => p.unit === unit)) setUnit(next.prices[0]!.unit);
    setAdded(null);
  }

  function addToCart(): string {
    add(
      {
        variantId: variant!.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant!.label,
        unit: price!.unit,
        price: price!.price,
        image: product.images[0] ?? null,
      },
      qty,
    );
    const msg = `${qty} ${price!.unit}${variant!.label ? ` ${variant!.label}` : ''}`;
    setAdded(msg);
    return msg;
  }

  const buyNow = () => {
    addToCart();
    router.push('/keranjang');
  };

  const subtotal = (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[14px] text-muted">Subtotal</span>
      <Price value={price.price * qty} className="text-[20px]" />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Kolom info */}
      <div className="min-w-0">
        {head}

        <div className="mt-4 border-y border-line py-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Price value={price.price} className="text-[30px] sm:text-[34px]" />
            <span className="text-muted">/{price.unit}</span>
          </div>
          {discount > 0 && (
            <p className="mt-1.5 flex items-center gap-2 text-[14px]">
              <span className="price rounded-[6px] bg-signal-tint px-1.5 py-1 text-[13px] text-signal-text">
                <span className="sr-only">Diskon </span>
                {discount}%
              </span>
              <s className="text-muted tabular-nums">
                <span className="sr-only">Harga normal </span>
                {formatRupiah(price.originalPrice!)}
              </s>
            </p>
          )}
        </div>

        {hasChoice && (
          <fieldset className="mt-5">
            <legend className="text-[14px] font-semibold">
              {isColor ? 'Pilih warna' : 'Pilih varian'}: <span className="font-normal text-muted">{variant.label}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v, i) => {
                const selected = i === vIdx;
                const soldOut = v.stockStatus === 'habis';
                return isColor ? (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pickVariant(i)}
                    aria-pressed={selected}
                    aria-label={`${v.label}${soldOut ? ' (stok habis)' : ''}`}
                    title={v.label}
                    className={`relative grid size-11 place-items-center rounded-full ${selected ? 'ring-2 ring-brand-text ring-offset-2 ring-offset-paper' : 'ring-1 ring-field hover:ring-ink'}`}
                  >
                    <span className="size-8 rounded-full ring-1 ring-black/15" style={{ background: v.colorHex! }} />
                    {soldOut && <span aria-hidden className="absolute h-[2px] w-9 rotate-45 bg-danger" />}
                  </button>
                ) : (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => pickVariant(i)}
                    aria-pressed={selected}
                    className={`min-h-10 rounded-tag border px-3.5 text-[14px] font-medium ${
                      selected ? 'border-brand bg-brand-tint text-brand-text' : 'border-field bg-surface hover:border-ink'
                    } ${soldOut ? 'text-muted line-through' : ''}`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {variant.prices.length > 1 && (
          <fieldset className="mt-5">
            <legend className="text-[14px] font-semibold">Pilih satuan</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {variant.prices.map((p) => {
                const perPiece = p.qtyPerUnit > 1 ? Math.round(p.price / p.qtyPerUnit) : null;
                const saving = perPiece !== null && perPiece < base.price;
                const selected = p.unit === price.unit;
                return (
                  <button
                    key={p.unit}
                    type="button"
                    onClick={() => setUnit(p.unit)}
                    aria-pressed={selected}
                    className={`relative min-h-11 rounded-tag border px-3.5 py-1.5 text-left ${selected ? 'border-brand bg-brand-tint text-brand-text' : 'border-field bg-surface hover:border-ink'}`}
                  >
                    <span className="block text-[14px] font-semibold capitalize">
                      {p.unit}
                      {p.qtyPerUnit > 1 && <span className="font-normal opacity-75"> · isi {p.qtyPerUnit}</span>}
                    </span>
                    <span className="block text-[12px] opacity-80 tabular-nums">
                      {formatRupiah(p.price)}
                      {saving && ` · ${formatRupiah(perPiece!)}/${base.unit}`}
                    </span>
                    {p.originalPrice && (
                      <span className="price absolute -top-2 -right-2 rounded-[5px] bg-signal px-1 py-0.5 text-[10px] text-white">
                        {Math.round((1 - p.price / p.originalPrice) * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Jumlah di HP (di layar lebar ada di kotak kanan) */}
        {!out && (
          <div className="mt-5 lg:hidden">
            <p className="text-[14px] font-semibold">Jumlah</p>
            <div className="mt-2 flex items-center gap-3">
              <Stepper qty={qty} setQty={setQty} />
              <span className={`text-[14px] font-medium ${stockCls}`}>{STOCK_LABEL[variant.stockStatus]}</span>
            </div>
            <div className="mt-3">{subtotal}</div>
          </div>
        )}

        <div className="mt-6">{children}</div>
      </div>

      {/* Kotak beli (layar lebar) */}
      <aside aria-label="Atur jumlah" className="hidden lg:block">
        <div className="card sticky top-[148px] p-4">
          <p className="text-[16px] font-bold">Atur jumlah</p>
          {(variant.label || variant.prices.length > 1) && (
            <p className="mt-1 truncate text-[13px] text-muted">
              {[variant.label, `per ${price.unit}`].filter(Boolean).join(' · ')}
            </p>
          )}
          {out ? (
            <p className="mt-4 rounded-tag bg-sunken p-3 text-[14px]">
              <span className="font-semibold text-danger">Stok sedang habis.</span> Hubungi kami untuk menanyakan jadwal stok berikutnya.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-3">
                <Stepper qty={qty} setQty={setQty} />
                <span className={`text-[13px] font-medium ${stockCls}`}>{STOCK_LABEL[variant.stockStatus]}</span>
              </div>
              <div className="mt-5">{subtotal}</div>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={addToCart} className="btn btn-primary">
                  <Plus size={18} weight="bold" aria-hidden />
                  Keranjang
                </button>
                <button type="button" onClick={buyNow} className="btn border-brand bg-surface text-brand-text hover:bg-brand-tint">
                  Beli langsung
                </button>
              </div>
            </>
          )}
          <a href={waHref} target="_blank" rel="noopener" className="mt-4 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-wa-text hover:underline">
            <WhatsappLogo size={18} weight="bold" aria-hidden />
            Tanya via WhatsApp
          </a>
          <div role="status" className="min-h-0">
            {added && (
              <p className="mt-3 flex items-start gap-1.5 rounded-tag bg-sunken p-2.5 text-[13px]">
                <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-ok" aria-hidden />
                <span>
                  {added} berhasil ditambahkan ke keranjang.{' '}
                  <Link href="/keranjang" className="font-semibold text-brand-text underline underline-offset-4">
                    Lihat keranjang
                  </Link>
                </span>
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Tombol beli menempel di bawah layar (HP & tablet) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {added && (
          <p role="status" className="border-b border-line px-4 py-2 text-[13px]">
            {added} berhasil ditambahkan ke keranjang.{' '}
            <Link href="/keranjang" className="font-semibold text-brand-text underline underline-offset-4">
              Lihat keranjang
            </Link>
          </p>
        )}
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
          <a href={waHref} target="_blank" rel="noopener" aria-label="Tanyakan produk ini via WhatsApp" className="grid size-11 shrink-0 place-items-center rounded-tag border border-field text-wa-text">
            <WhatsappLogo size={22} weight="bold" aria-hidden />
          </a>
          {out ? (
            <a href={waHref} target="_blank" rel="noopener" className="btn btn-secondary flex-1">
              Tanyakan ketersediaan
            </a>
          ) : (
            <>
              <button type="button" onClick={buyNow} className="btn flex-1 border-brand bg-surface px-3 text-brand-text">
                Beli langsung
              </button>
              <button type="button" onClick={addToCart} className="btn btn-primary flex-1 px-3">
                <Plus size={18} weight="bold" aria-hidden />
                Keranjang
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
