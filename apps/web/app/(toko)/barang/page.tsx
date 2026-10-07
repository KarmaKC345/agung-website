import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SortSelect } from '@/components/ListControls';
import { hrefWith, Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductCard';
import { getCategories, getProducts } from '@/lib/api';

type Props = { searchParams: Promise<{ sort?: string; page?: string }> };

export const metadata: Metadata = {
  title: 'Katalog barang',
  description: 'Semua barang di Toko New Agung Makassar: alat tulis, kertas, map, perlengkapan kantor, kalkulator, dan tinta. Pesan lewat WhatsApp.',
  alternates: { canonical: '/barang' },
};

export default async function CatalogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, categories] = await Promise.all([getProducts({ sort: sp.sort, page, pageSize: 30 }), getCategories()]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <Breadcrumbs items={[{ label: 'Katalog' }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-bold">
          Katalog <span className="text-[16px] font-normal text-muted tabular-nums">{result.total} barang</span>
        </h1>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      <nav aria-label="Saring per kategori" className="scrollbar-none -mx-4 mt-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/kategori/${c.slug}`}
                className="tap inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[14px] font-medium hover:border-ink"
              >
                {c.name}
                <span className="text-[12px] opacity-60 tabular-nums">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5">
        <ProductGrid products={result.items} priorityCount={2} />
      </div>
      <Pagination page={page} pageSize={result.pageSize} total={result.total} makeHref={(p) => hrefWith('/barang', { sort: sp.sort, page: p })} />
    </div>
  );
}
