import type { Metadata } from 'next';
import { WhatsappLogo } from '@phosphor-icons/react/ssr';
import { waLink } from '@newagung/shared';
import { Catalog } from '@/components/Catalog';
import { getBrands, getCategories, getProducts, getStore } from '@/lib/api';
import { currentQuery, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = { searchParams: Promise<CatalogSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Cari “${q}”` : 'Cari barang', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const list = toListParams(sp);

  if (!q) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <h1 className="text-[24px] font-bold">Cari barang</h1>
        <p className="mt-2 text-muted">Ketik nama barang, merek, atau jenisnya di kotak cari di atas.</p>
      </div>
    );
  }

  const [result, store, categories, brands] = await Promise.all([getProducts({ ...list, q, pageSize: 30 }), getStore(), getCategories(), getBrands()]);
  const filtered = Boolean(list.brand || list.promo || list.featured || list.minPrice || list.maxPrice);

  const askStore = (
    <div className="card max-w-xl rounded-[var(--radius-media)] p-6 sm:p-8">
      <p className="text-[17px] font-semibold">“{q}” {filtered ? 'tidak ada dengan filter ini.' : 'belum ada di website.'}</p>
      <p className="mt-2 text-muted">
        {filtered ? 'Coba hapus sebagian filter. ' : ''}Belum semua barang di rak sudah dimasukkan ke website. Tanyakan langsung ke toko, biasanya dibalas di jam buka.
      </p>
      <a href={waLink(store.whatsapp, `Halo New Agung, apakah ada ${q}?`)} target="_blank" rel="noopener" className="btn btn-wa mt-6">
        <WhatsappLogo size={20} weight="bold" aria-hidden />
        Tanya stok “{q}” via WhatsApp
      </a>
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
            Hasil untuk “{q}” <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} barang</span>
          </h1>
        }
        empty={askStore}
      />
    </div>
  );
}
