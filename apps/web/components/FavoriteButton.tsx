'use client';

import { useShop } from '@/lib/cart';
import { useHydrated } from '@/lib/use-hydrated';

export function FavoriteButton({ productId, name, className = '' }: { productId: string; name: string; className?: string }) {
  const hydrated = useHydrated();
  const isFav = useShop((s) => s.favorites.includes(productId));
  const toggle = useShop((s) => s.toggleFavorite);
  const on = hydrated && isFav;
  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={on}
      aria-label={on ? `Hapus ${name} dari favorit` : `Simpan ${name} ke favorit`}
      className={`grid size-9 place-items-center rounded-full bg-surface/90 text-ink ring-1 ring-line hover:ring-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden fill={on ? 'var(--accent)' : 'none'} stroke={on ? 'var(--accent)' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    </button>
  );
}
