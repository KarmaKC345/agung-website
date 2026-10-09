'use client';

import { Check, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ProductSummary } from '@newagung/shared';
import { useShop } from '@/lib/cart';
import { useToast } from '@/lib/toast';

/** Tombol + di kartu barang: hanya untuk barang tanpa pilihan varian */
export function QuickAdd({ product }: { product: ProductSummary }) {
  const add = useShop((s) => s.add);
  const [added, setAdded] = useState(false);
  const q = product.quickAdd!;
  return (
    <button
      type="button"
      onClick={() => {
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
      }}
      aria-label={`Tambah ${product.name} ke keranjang`}
      className={`tap grid size-10 shrink-0 place-items-center rounded-[10px] text-white active:scale-95 ${added ? 'bg-ok' : 'bg-brand hover:bg-brand-hover'}`}
    >
      {added ? <Check size={18} weight="bold" aria-hidden /> : <Plus size={18} weight="bold" aria-hidden />}
      <span className="sr-only" role="status">
        {added ? `${product.name} ditambahkan ke keranjang` : ''}
      </span>
    </button>
  );
}
