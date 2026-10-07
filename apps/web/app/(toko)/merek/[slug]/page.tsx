import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SortSelect } from '@/components/ListControls';
import { hrefWith, Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductCard';
import { getBrands, getProducts } from '@/lib/api';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string; page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  return brand ? { title: `${brand.name}`, description: `Produk ${brand.name} di Toko New Agung Makassar.` } : {};
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  if (!brand) notFound();
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await getProducts({ brand: slug, sort: sp.sort, page, pageSize: 30 });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <Breadcrumbs items={[{ href: '/kategori', label: 'Merek' }, { label: brand.name }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-bold">
          {brand.name} <span className="text-[16px] font-normal text-muted tabular-nums">{result.total} barang</span>
        </h1>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>
      <div className="mt-4">
        <ProductGrid products={result.items} priorityCount={2} />
      </div>
      <Pagination page={page} pageSize={result.pageSize} total={result.total} makeHref={(p) => hrefWith(`/merek/${slug}`, { sort: sp.sort, page: p })} />
    </div>
  );
}
