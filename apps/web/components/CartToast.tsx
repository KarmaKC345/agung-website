'use client';

import { CheckCircle, ShoppingBag, X } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useToast } from '@/lib/toast';

export function CartToast() {
  const { item, hide } = useToast();

  useEffect(() => {
    if (!item) return;
    const t = setTimeout(hide, 3500);
    return () => clearTimeout(t);
  }, [item, hide]);

  if (!item) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 z-50 left-1/2 w-[92vw] max-w-md -translate-x-1/2 md:bottom-6"
    >
      <div className="flex items-center gap-3 rounded-tag border border-line-strong/30 bg-ink px-3.5 py-3 text-white shadow-2xl backdrop-blur-md">
        <CheckCircle size={22} weight="fill" className="shrink-0 text-ok" aria-hidden />
        <div className="min-w-0 flex-1 text-[13px]">
          <p className="truncate font-semibold text-white">{item.name}</p>
          <p className="text-[11px] text-gray-300">
            +{item.qty} {item.unit} ditambahkan ke keranjang
          </p>
        </div>
        <Link
          href="/keranjang"
          onClick={hide}
          className="flex shrink-0 items-center gap-1.5 rounded-[8px] bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-hover active:scale-95"
        >
          <ShoppingBag size={14} weight="bold" aria-hidden />
          Keranjang
        </Link>
        <button
          type="button"
          onClick={hide}
          className="tap -mr-1 p-1 text-gray-400 hover:text-white"
          aria-label="Tutup pemberitahuan"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
