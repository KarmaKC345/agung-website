import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Catalog } from '@/components/Catalog';
import { getBrands, getCategories, getProducts } from '@/lib/api';
import { currentQuery, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = { searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = toListParams(await searchParams);
  const title = p.promo ? 'Promo spesial' : p.featured ? 'Pilihan toko' : p.sort === 'terlaris' ? 'Produk terlaris' : 'Semua produk';
  return {
    title,
    description: 'Semua produk Toko New Agung Makassar: alat tulis, kertas, map, perlengkapan kantor, kalkulator, dan tinta. Pesan melalui WhatsApp.',
    alternates: { canonical: '/barang' },
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = toListParams(sp);
  const [result, categories, brands] = await Promise.all([getProducts({ ...params, pageSize: 30 }), getCategories(), getBrands()]);
  const title = params.promo ? 'Promo spesial' : params.featured ? 'Pilihan toko' : params.sort === 'terlaris' ? 'Produk terlaris' : 'Semua produk';

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ label: 'Semua produk' }]} />
      <Catalog
        base="/barang"
        query={currentQuery(sp, params)}
        categories={categories}
        brands={brands}
        result={result}
        page={params.page}
        header={
          <h1 className="text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">
            {title} <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} produk</span>
          </h1>
        }
        empty={<p className="card rounded-[var(--radius-media)] p-8 text-center text-muted">Belum ada produk yang sesuai dengan filter Anda. Silakan ubah atau hapus filter.</p>}
      />
    </div>
  );
}
