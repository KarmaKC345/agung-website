'use client';

import { BookmarkSimple } from '@phosphor-icons/react';
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
      className={`tap grid size-9 place-items-center rounded-full bg-surface/90 shadow-[0_2px_8px_-4px_rgb(var(--shadow-tint)/0.4)] backdrop-blur hover:bg-surface active:scale-95 ${
        on ? 'text-brand-text' : 'text-ink'
      } ${className}`}
    >
      <BookmarkSimple size={18} weight={on ? 'fill' : 'bold'} aria-hidden />
    </button>
  );
}
