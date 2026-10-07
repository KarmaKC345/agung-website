'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatRupiah, STOCK_LABEL, type ProductDetail } from '@newagung/shared';
import { useShop } from '@/lib/cart';
import { Price } from './Price';

/** Pilih varian (warna/ukuran), satuan (pcs/lusin/rim…), jumlah, lalu masukkan keranjang */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const firstAvailable = product.variants.findIndex((v) => v.stockStatus !== 'habis');
  const [vIdx, setVIdx] = useState(firstAvailable >= 0 ? firstAvailable : 0);
  const variant = product.variants[vIdx];
  const [unit, setUnit] = useState(variant?.prices[0]?.unit ?? 'pcs');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<string | null>(null);
  const add = useShop((s) => s.add);

  const price = useMemo(() => variant?.prices.find((p) => p.unit === unit) ?? variant?.prices[0], [variant, unit]);
  if (!variant || !price) return null;

  const out = variant.stockStatus === 'habis';
  const hasChoice = product.variants.length > 1;
  const isColor = product.variants.every((v) => v.colorHex);
  const base = variant.prices[0]!;

  function pickVariant(i: number) {
    setVIdx(i);
    const next = product.variants[i]!;
    if (!next.prices.some((p) => p.unit === unit)) setUnit(next.prices[0]!.unit);
    setAdded(null);
  }

  return (
    <div>
      {hasChoice && (
        <fieldset className="mt-6">
          <legend className="text-[14px] font-semibold">
            {isColor ? 'Warna' : 'Pilihan'}: <span className="font-normal">{variant.label}</span>
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
                  className={`relative grid size-11 place-items-center rounded-full ${selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'ring-1 ring-line-strong'}`}
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
                  className={`h-11 rounded-tag border px-3.5 text-[14px] font-medium ${
                    selected ? 'border-ink bg-ink text-surface' : 'border-line-strong bg-surface hover:border-ink'
                  } ${soldOut ? 'line-through opacity-60' : ''}`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {variant.prices.length > 1 && (
        <fieldset className="mt-6">
          <legend className="text-[14px] font-semibold">Beli per</legend>
          <div className="mt-2 inline-flex rounded-tag border border-line-strong bg-surface p-1">
            {variant.prices.map((p) => {
              const perPiece = p.qtyPerUnit > 1 ? Math.round(p.price / p.qtyPerUnit) : null;
              const saving = perPiece !== null && perPiece < base.price;
              return (
                <button
                  key={p.unit}
                  type="button"
                  onClick={() => setUnit(p.unit)}
                  aria-pressed={p.unit === price.unit}
                  className={`min-h-11 rounded-tag px-3.5 py-1.5 text-left ${p.unit === price.unit ? 'bg-ink text-surface' : 'hover:bg-sunken'}`}
                >
                  <span className="block text-[14px] font-semibold capitalize">
                    {p.unit}
                    {p.qtyPerUnit > 1 && <span className="font-normal opacity-70"> · isi {p.qtyPerUnit}</span>}
                  </span>
                  {saving && <span className="block text-[11px] opacity-80">{formatRupiah(perPiece!)}/{base.unit}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-baseline gap-2">
        <Price value={price.price} className="text-[40px]" />
        <span className="text-muted">/{price.unit}</span>
      </div>
      <p className={`mt-1 text-[14px] font-medium ${out ? 'text-danger' : variant.stockStatus === 'sedikit' ? 'text-warn' : 'text-ok'}`}>
        {STOCK_LABEL[variant.stockStatus]}
      </p>

      {!out && (
        <div className="mt-5 flex flex-wrap items-stretch gap-3">
          <div className="flex h-12 items-center rounded-tag border border-line-strong bg-surface">
            <button type="button" className="h-full w-11 text-[20px]" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Kurangi jumlah">
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={9999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))}
              aria-label="Jumlah"
              className="price h-full w-14 bg-transparent text-center text-[20px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" className="h-full w-11 text-[20px]" onClick={() => setQty((q) => Math.min(9999, q + 1))} aria-label="Tambah jumlah">
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              add(
                {
                  variantId: variant.id,
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  variantLabel: variant.label,
                  unit: price.unit,
                  price: price.price,
                  image: product.images[0] ?? null,
                },
                qty,
              );
              setAdded(`${qty} ${price.unit}${variant.label ? ` ${variant.label}` : ''}`);
            }}
            className="h-12 flex-1 rounded-tag bg-accent px-5 text-[16px] font-semibold text-accent-ink hover:brightness-110 sm:flex-none"
          >
            Masukkan keranjang
          </button>
        </div>
      )}

      <div role="status" className="min-h-6">
        {added && (
          <p className="mt-3 text-[14px]">
            {added} masuk keranjang.{' '}
            <Link href="/keranjang" className="font-semibold text-brand-text underline underline-offset-4">
              Lihat keranjang
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
