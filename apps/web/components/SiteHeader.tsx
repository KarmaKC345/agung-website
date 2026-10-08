import { BookmarkSimple, MapPin, SquaresFour, WhatsappLogo } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { Suspense } from 'react';
import { formatPhone, waLink, type Category, type StoreInfo } from '@newagung/shared';
import { CartLink } from './CartLink';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { StatusPill } from './StatusPill';

/** Pintasan di bawah kotak cari (layar lebar), seperti tautan cepat di marketplace */
const QUICK = [
  { href: '/barang?promo=1', label: 'Promo', promo: true },
  { href: '/barang?sort=terlaris', label: 'Terlaris' },
  { href: '/barang?sort=terbaru', label: 'Produk terbaru' },
];

export function SiteHeader({ store, categories }: { store: StoreInfo; categories: Category[] }) {
  const quick = [
    ...QUICK,
    ...categories
      .filter((c) => c.productCount > 0)
      .slice(0, 5)
      .map((c) => ({ href: `/kategori/${c.slug}`, label: c.name, promo: false })),
  ];
  return (
    <header className="sticky top-0 z-30 bg-surface shadow-[0_1px_0_var(--line)]">
      {/* Strip info toko */}
      <div className="hidden border-b border-line bg-sunken/60 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-5 px-4 text-[13px] text-muted">
          <a href={store.mapsUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-ink">
            <MapPin size={14} weight="bold" aria-hidden />
            Jl. DR. Ratulangi No.52, Makassar
          </a>
          <Link href="/tentang" className="hover:text-ink" aria-label="Jam buka toko">
            <StatusPill hours={store.openingHours} timezone={store.timezone} />
          </Link>
          <span className="ml-auto flex items-center gap-5">
            <Link href="/tentang" className="hover:text-ink">
              Tentang toko
            </Link>
            <a href={waLink(store.whatsapp)} target="_blank" rel="noopener" className="flex items-center gap-1.5 font-medium text-wa-text hover:underline">
              <WhatsappLogo size={15} weight="bold" aria-hidden />
              {formatPhone(store.whatsapp)}
            </a>
          </span>
        </div>
      </div>

      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 md:gap-5 md:py-3 lg:pb-1.5">
        <Link
          href="/"
          className="tap shrink-0 rounded-[10px] text-ink dark:bg-[#e3e4e6] dark:px-1.5 dark:py-0.5 dark:text-[#15172b]"
          aria-label="Toko New Agung, ke beranda"
        >
          <Logo className="h-9 w-auto md:h-11" />
        </Link>
        <Link
          href="/kategori"
          className="hidden h-11 shrink-0 items-center gap-2 rounded-tag px-3 text-[15px] font-semibold text-ink hover:bg-sunken lg:flex"
        >
          <SquaresFour size={20} weight="bold" aria-hidden />
          Kategori
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">
          <Suspense>
            <SearchBox large />
          </Suspense>
          <nav aria-label="Pintasan" className="mt-1 hidden h-5 overflow-hidden lg:block">
            <ul className="flex gap-4 text-[12px] text-muted">
              {quick.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className={`hover:text-ink ${q.promo ? 'font-semibold text-signal-text' : ''}`}>
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Link href="/favorit" className="tap hidden size-11 place-items-center rounded-tag text-ink hover:bg-sunken md:grid" aria-label="Favorit">
            <BookmarkSimple size={22} weight="bold" aria-hidden />
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
