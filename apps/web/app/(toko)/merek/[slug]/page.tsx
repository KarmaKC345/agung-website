import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Catalog } from '@/components/Catalog';
import { getBrands, getCategories, getProducts } from '@/lib/api';
import { currentQuery, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  return brand ? { title: `${brand.name}`, description: `Produk ${brand.name} di Toko New Agung Makassar.`, alternates: { canonical: `/merek/${slug}` } } : {};
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const [brands, categories] = await Promise.all([getBrands(), getCategories()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  const list = { ...toListParams(sp), brand: slug };
  const result = await getProducts({ ...list, pageSize: 30 });
  const { merek: _drop, ...query } = currentQuery(sp, list);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ href: '/kategori', label: 'Merek' }, { label: brand.name }]} />
      <Catalog
        base={`/merek/${slug}`}
        query={query}
        categories={categories}
        brands={brands}
        hideBrand
        result={result}
        page={list.page}
        header={
          <h1 className="text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">
            {brand.name} <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} barang</span>
          </h1>
        }
        empty={<p className="card rounded-[var(--radius-media)] p-8 text-center text-muted">Tidak ada barang {brand.name} yang cocok dengan filter ini.</p>}
      />
    </div>
  );
}
