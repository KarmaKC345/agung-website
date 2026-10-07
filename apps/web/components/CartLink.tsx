'use client';

import { Basket } from '@phosphor-icons/react';
import Link from 'next/link';
import { useShop } from '@/lib/cart';
import { useHydrated } from '@/lib/use-hydrated';

export function CartLink() {
  const hydrated = useHydrated();
  const count = useShop((s) => s.lines.length);
  const n = hydrated ? count : 0;
  return (
    <Link href="/keranjang" className="btn btn-secondary relative h-11 px-3.5" aria-label={`Keranjang, ${n} barang`}>
      <Basket size={20} weight="bold" aria-hidden />
      <span className="hidden md:inline">Keranjang</span>
      {n > 0 && (
        <span className="price absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] text-white">
          {n}
        </span>
      )}
    </Link>
  );
}
