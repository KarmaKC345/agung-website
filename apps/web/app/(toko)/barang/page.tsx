import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Catalog } from '@/components/Catalog';
import { getBrands, getCategories, getProducts } from '@/lib/api';
import { currentQuery, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = { searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = toListParams(await searchParams);
  const title = p.promo ? 'Barang promo' : p.featured ? 'Pilihan toko' : p.sort === 'terlaris' ? 'Barang terlaris' : 'Katalog barang';
  return {
    title,
    description: 'Semua barang di Toko New Agung Makassar: alat tulis, kertas, map, perlengkapan kantor, kalkulator, dan tinta. Pesan lewat WhatsApp.',
    alternates: { canonical: '/barang' },
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = toListParams(sp);
  const [result, categories, brands] = await Promise.all([getProducts({ ...params, pageSize: 30 }), getCategories(), getBrands()]);
  const title = params.promo ? 'Lagi promo' : params.featured ? 'Pilihan toko' : params.sort === 'terlaris' ? 'Paling sering dibeli' : 'Semua barang';

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ label: 'Katalog' }]} />
      <Catalog
        base="/barang"
        query={currentQuery(sp, params)}
        categories={categories}
        brands={brands}
        result={result}
        page={params.page}
        header={
          <h1 className="text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">
            {title} <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} barang</span>
          </h1>
        }
        empty={<p className="card rounded-[var(--radius-media)] p-8 text-center text-muted">Tidak ada barang yang cocok dengan filter ini.</p>}
      />
    </div>
  );
}
