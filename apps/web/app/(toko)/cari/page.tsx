import type { Metadata } from 'next';
import { WhatsappLogo } from '@phosphor-icons/react/ssr';
import { Suspense } from 'react';
import { waLink } from '@newagung/shared';
import { SortSelect } from '@/components/ListControls';
import { hrefWith, Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductCard';
import { getProducts, getStore } from '@/lib/api';

type Props = { searchParams: Promise<{ q?: string; sort?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Cari “${q}”` : 'Cari barang', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);

  if (!q) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <h1 className="text-[24px] font-bold">Cari barang</h1>
        <p className="mt-2 text-muted">Ketik nama barang, merek, atau jenisnya di kotak cari di atas.</p>
      </div>
    );
  }

  const [result, store] = await Promise.all([getProducts({ q, sort: sp.sort, page, pageSize: 30 }), getStore()]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[22px] font-bold">
          “{q}” <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} barang</span>
        </h1>
        {result.total > 0 && (
          <Suspense>
            <SortSelect withRelevance />
          </Suspense>
        )}
      </div>

      {result.total > 0 ? (
        <>
          <div className="mt-4">
            <ProductGrid products={result.items} priorityCount={2} />
          </div>
          <Pagination page={page} pageSize={result.pageSize} total={result.total} makeHref={(p) => hrefWith('/cari', { q, sort: sp.sort, page: p })} />
        </>
      ) : (
        <div className="card mt-6 max-w-xl rounded-[var(--radius-media)] p-6 sm:p-8">
          <p className="text-[17px] font-semibold">“{q}” belum ada di website.</p>
          <p className="mt-2 text-muted">
            Belum semua barang di rak sudah dimasukkan ke website. Tanyakan langsung ke toko, biasanya dibalas di jam buka.
          </p>
          <a
            href={waLink(store.whatsapp, `Halo New Agung, apakah ada ${q}?`)}
            target="_blank"
            rel="noopener"
            className="btn btn-wa mt-6"
          >
            <WhatsappLogo size={20} weight="bold" aria-hidden />
            Tanya stok “{q}” via WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
