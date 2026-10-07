import Link from 'next/link';
import { Suspense } from 'react';
import type { StoreInfo } from '@newagung/shared';
import { CartLink } from './CartLink';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { StatusPill } from './StatusPill';

const NAV = [
  { href: '/barang', label: 'Katalog' },
  { href: '/kategori', label: 'Kategori' },
  { href: '/tentang', label: 'Tentang toko' },
  { href: '/favorit', label: 'Favorit' },
];

export function SiteHeader({ store }: { store: StoreInfo }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:h-[72px] md:gap-6">
        <Link
          href="/"
          className="tap shrink-0 rounded-[10px] text-ink dark:bg-[#e3e4e6] dark:px-1.5 dark:py-0.5 dark:text-[#15172b]"
          aria-label="New Agung, beranda"
        >
          <Logo className="h-9 w-auto md:h-11" />
        </Link>
        <div className="hidden min-w-0 max-w-md flex-1 md:block">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
        <nav aria-label="Menu utama" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-muted hover:bg-sunken hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <Link href="/tentang" className="hidden text-muted hover:text-ink xl:block" aria-label="Jam buka toko">
            <StatusPill hours={store.openingHours} timezone={store.timezone} />
          </Link>
          <CartLink />
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
