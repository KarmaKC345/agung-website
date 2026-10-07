'use client';

import { Basket, BookmarkSimple, House, SquaresFour, type Icon } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from '@/lib/cart';
import { useHydrated } from '@/lib/use-hydrated';

const items: { href: string; label: string; icon: Icon }[] = [
  { href: '/', label: 'Beranda', icon: House },
  { href: '/kategori', label: 'Kategori', icon: SquaresFour },
  { href: '/favorit', label: 'Favorit', icon: BookmarkSimple },
  { href: '/keranjang', label: 'Keranjang', icon: Basket },
];

/** Navigasi bawah khusus HP */
export function BottomNav() {
  const path = usePathname();
  const hydrated = useHydrated();
  const count = useShop((s) => s.lines.length);
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? 'text-brand-text' : 'text-muted'}`}
              >
                <Icon size={24} weight={active ? 'fill' : 'regular'} aria-hidden />
                {label}
                {href === '/keranjang' && hydrated && count > 0 && (
                  <span className="price absolute top-2 left-1/2 ml-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-signal px-1 text-[10px] text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
