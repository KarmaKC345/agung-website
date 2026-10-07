'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from '@/lib/cart';
import { useHydrated } from '@/lib/use-hydrated';
import { BasketIcon } from './CartLink';

const items = [
  { href: '/', label: 'Beranda', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { href: '/kategori', label: 'Kategori', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { href: '/favorit', label: 'Favorit', icon: 'M6 3h12v18l-6-4-6 4z' },
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={isActive(it.href) ? 'page' : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                isActive(it.href) ? 'text-brand-text' : 'text-muted'
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d={it.icon} />
              </svg>
              {it.label}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/keranjang"
            aria-current={isActive('/keranjang') ? 'page' : undefined}
            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isActive('/keranjang') ? 'text-brand-text' : 'text-muted'
            }`}
          >
            <BasketIcon className="size-[22px]" />
            Keranjang
            {hydrated && count > 0 && (
              <span className="price absolute top-1.5 left-1/2 ml-2 min-w-[18px] rounded-full bg-accent px-1 py-0.5 text-center text-[11px] text-accent-ink">
                {count}
              </span>
            )}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
