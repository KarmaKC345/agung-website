import Link from 'next/link';
import { Suspense } from 'react';
import type { StoreInfo } from '@newagung/shared';
import { CartLink } from './CartLink';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { StatusPill } from './StatusPill';

export function SiteHeader({ store }: { store: StoreInfo }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-2.5 pb-2.5 md:gap-6 md:py-3">
        <Link href="/" className="tap shrink-0 rounded-tag text-ink dark:bg-[#e3e4e6] dark:px-1.5 dark:py-0.5 dark:text-[#15172b]" aria-label="New Agung — beranda">
          <Logo className="h-10 w-auto md:h-12" />
        </Link>
        <div className="hidden flex-1 md:block">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/tentang" className="hidden text-muted hover:text-ink lg:block">
            <StatusPill hours={store.openingHours} timezone={store.timezone} />
          </Link>
          <Link href="/favorit" className="hidden h-11 items-center px-1 text-[15px] font-medium text-muted hover:text-ink md:flex">
            Favorit
          </Link>
          <CartLink />
        </div>
      </div>
      <div className="px-4 pb-2.5 md:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
