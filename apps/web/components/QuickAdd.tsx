'use client';

import { Check, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ProductSummary } from '@newagung/shared';
import { useShop } from '@/lib/cart';
import { useToast } from '@/lib/toast';
import { VariantPickerSheet } from './VariantPickerSheet';

/**
 * Tombol + di kartu barang:
 * - 1 varian (product.quickAdd): langsung tambah 1 pcs ke keranjang (+ toast)
 * - >1 varian: buka Bottom Sheet pop-up ala Shopee/Tokopedia untuk pilih varian/warna & jumlah
 */
export function QuickAdd({ product }: { product: ProductSummary }) {
  const add = useShop((s) => s.add);
  const [added, setAdded] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (product.quickAdd) {
      const q = product.quickAdd;
      add(
        {
          variantId: q.variantId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          variantLabel: q.label,
          unit: q.unit,
          price: q.price,
          image: product.image,
        },
        1,
      );
      useToast.getState().show({ title: product.name, cart: { qty: 1, unit: q.unit } });
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } else {
      setShowSheet(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={product.quickAdd ? `Tambah ${product.name} ke keranjang` : `Pilih varian ${product.name}`}
        className={`tap grid size-10 shrink-0 place-items-center rounded-[10px] text-white active:scale-95 transition-all ${
          added ? 'bg-ok' : 'bg-brand hover:bg-brand-hover shadow-xs'
        }`}
      >
        {added ? <Check size={18} weight="bold" aria-hidden /> : <Plus size={18} weight="bold" aria-hidden />}
        <span className="sr-only" role="status">
          {added ? `${product.name} ditambahkan ke keranjang` : ''}
        </span>
      </button>

      {showSheet && (
        <VariantPickerSheet product={product} onClose={() => setShowSheet(false)} />
      )}
    </>
  );
}
