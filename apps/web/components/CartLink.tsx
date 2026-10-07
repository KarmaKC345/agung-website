'use client';

import Link from 'next/link';
import { useShop } from '@/lib/cart';
import { useHydrated } from '@/lib/use-hydrated';

export function CartLink() {
  const hydrated = useHydrated();
  const count = useShop((s) => s.lines.length);
  const n = hydrated ? count : 0;
  return (
    <Link
      href="/keranjang"
      className="relative flex h-11 items-center gap-2 rounded-tag border border-line-strong bg-surface px-3 text-[15px] font-semibold hover:border-ink"
      aria-label={`Keranjang, ${n} barang`}
    >
      <BasketIcon className="size-5" />
      <span className="hidden md:inline">Keranjang</span>
      {n > 0 && (
        <span className="price min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[12px] text-accent-ink">{n}</span>
      )}
    </Link>
  );
}

export function BasketIcon({ className }: { className?: string }) {
  // keranjang belanja merah toko: badan anyaman + pegangan
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 9h18l-2 11H5L3 9Z" />
      <path d="M8 9a4 4 0 0 1 8 0" />
      <path d="M8 13v4M12 13v4M16 13v4" strokeLinecap="round" />
    </svg>
  );
}
