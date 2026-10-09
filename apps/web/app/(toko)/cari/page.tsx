import type { Metadata } from 'next';
import { WhatsappLogo } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { waLink } from '@newagung/shared';
import { Catalog } from '@/components/Catalog';
import { ProductGrid } from '@/components/ProductCard';
import { getBrands, getCategories, getProducts, getStore } from '@/lib/api';
import { currentQuery, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = { searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Hasil pencarian “${q}”` : 'Cari produk', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const list = toListParams(sp);

  if (!q) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <h1 className="text-[24px] font-bold">Cari produk</h1>
        <p className="mt-2 text-muted">Ketik nama produk, merek, atau kategori pada kolom pencarian di atas.</p>
      </div>
    );
  }

  const [result, store, categories, brands, popular] = await Promise.all([
    getProducts({ ...list, q, pageSize: 30 }),
    getStore(),
    getCategories(),
    getBrands(),
    getProducts({ sort: 'terlaris', pageSize: 6 }),
  ]);
  const filtered = Boolean(list.brand || list.promo || list.featured || list.minPrice || list.maxPrice);

  const askStore = (
    <div className="card max-w-2xl rounded-[var(--radius-media)] p-6 sm:p-8">
      <p className="text-[18px] font-bold">
        {filtered ? <>Tidak ada hasil untuk “{q}” dengan filter yang dipilih</> : <>Produk “{q}” tidak ditemukan</>}
      </p>
      {filtered ? (
        <p className="mt-2 leading-relaxed text-muted">Hapus sebagian filter untuk melihat hasil pencarian lainnya.</p>
      ) : (
        <>
          <p className="mt-2 leading-relaxed text-muted">Periksa kembali ejaan kata kunci, atau gunakan kata yang lebih umum, misalnya “pulpen” atau “kertas A4”.</p>
          <p className="mt-3 leading-relaxed text-muted">
            Belum semua produk di toko kami ditampilkan di website. Silakan tanyakan ketersediaan produk ini kepada kami melalui WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={waLink(store.whatsapp, `Halo Toko New Agung, saya ingin menanyakan ketersediaan produk ${q}.`)}
              target="_blank"
              rel="noopener"
              className="btn btn-wa"
            >
              <WhatsappLogo size={20} weight="bold" aria-hidden />
              Tanyakan via WhatsApp
            </a>
            <Link href="/barang" className="btn btn-secondary">
              Lihat semua produk
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Catalog
        base="/cari"
        query={{ ...currentQuery(sp, list), q }}
        categories={categories}
        brands={brands}
        withRelevance
        result={result}
        page={list.page}
        header={
          <h1 className="text-[22px] font-bold tracking-[-0.015em]">
            Hasil pencarian “{q}” <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} produk</span>
          </h1>
        }
        empty={
          <div className="space-y-8">
            {askStore}
            {popular.items.length > 0 && (
              <div>
                <h2 className="mb-3 text-[18px] font-bold text-ink">Produk terlaris toko</h2>
                <ProductGrid products={popular.items} />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
