'use client';

import { useState } from 'react';
import type { ProductSummary } from '@newagung/shared';
import { useShop } from '@/lib/cart';

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
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
      aria-label={`Tambah ${product.name} ke keranjang`}
      className={`tap grid size-9 shrink-0 place-items-center rounded-tag text-[22px] leading-none font-semibold transition-colors ${
        added ? 'bg-ok text-white' : 'bg-ink text-surface hover:bg-accent'
      }`}
    >
      <span aria-hidden>{added ? '✓' : '+'}</span>
      <span className="sr-only" role="status">
        {added ? 'Ditambahkan' : ''}
      </span>
    </button>
  );
}
