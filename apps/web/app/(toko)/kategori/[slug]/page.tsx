import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AisleSigns, signText } from '@/components/AisleSigns';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SortSelect } from '@/components/ListControls';
import { hrefWith, Pagination } from '@/components/Pagination';
import { ProductGrid } from '@/components/ProductCard';
import { findCategory, getBrands, getCategories, getProducts } from '@/lib/api';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; merek?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = findCategory(await getCategories(), slug);
  if (!found) return {};
  return {
    title: found.category.name,
    description: `Harga ${found.category.name.toLowerCase()} di Toko New Agung Makassar. Pesan lewat WhatsApp, ambil di Jl. DR. Ratulangi No.52.`,
    alternates: { canonical: `/kategori/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const [tree, brands] = await Promise.all([getCategories(), getBrands()]);
  const found = findCategory(tree, slug);
  if (!found) notFound();
  const { category, parent } = found;
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await getProducts({ category: slug, brand: sp.merek, sort: sp.sort, page, pageSize: 30 });
  const siblings = parent ? parent.children ?? [] : category.children ?? [];
  const brandsHere = brands.filter((b) => (b.productCount ?? 0) > 0);
  const base = `/kategori/${slug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <Breadcrumbs items={[{ href: '/kategori', label: 'Kategori' }, ...(parent ? [{ href: `/kategori/${parent.slug}`, label: parent.name }] : []), { label: category.name }]} />

      <div className="mt-5 md:w-[340px]">
        <div className="aisle-rail">
          <h1 className="aisle-sign transform-none! text-center" aria-label={category.name}>
            <span className="signage block text-[20px]">{signText(category.name)}</span>
            <span className="mt-1 block text-[12px] text-muted">{category.productCount} barang</span>
          </h1>
        </div>
      </div>

      {siblings.length > 0 && (
        <nav aria-label="Sub-kategori" className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4">
          <ul className="flex w-max gap-2">
            <li>
              <Link
                href={`/kategori/${parent?.slug ?? category.slug}`}
                aria-current={!parent ? 'page' : undefined}
                className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3.5 text-[14px] font-medium aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface"
              >
                Semua
              </Link>
            </li>
            {siblings.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kategori/${c.slug}`}
                  aria-current={c.slug === slug ? 'page' : undefined}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[14px] font-medium aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface"
                >
                  {c.name}
                  <span className="text-[12px] opacity-60 tabular-nums">{c.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <form className="flex items-center gap-2 text-[14px]" action={base}>
          <label htmlFor="merek" className="text-muted">
            Merek
          </label>
          <select
            id="merek"
            name="merek"
            defaultValue={sp.merek ?? ''}
            className="h-9 rounded-tag border border-line-strong bg-surface px-2 font-medium"
          >
            <option value="">Semua merek</option>
            {brandsHere.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
          {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
          <button className="h-9 rounded-tag border border-line-strong bg-surface px-3 font-semibold hover:border-ink">Terapkan</button>
        </form>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      <div className="mt-4">
        {result.items.length ? (
          <ProductGrid products={result.items} priorityCount={2} />
        ) : (
          <p className="rounded-tag border border-dashed border-line-strong bg-surface p-6 text-center text-muted">
            Belum ada barang di lorong ini{sp.merek ? ' untuk merek tersebut' : ''}.
          </p>
        )}
      </div>
      <Pagination
        page={page}
        pageSize={result.pageSize}
        total={result.total}
        makeHref={(p) => hrefWith(base, { merek: sp.merek, sort: sp.sort, page: p })}
      />

      <section className="mt-14" aria-labelledby="lorong-lain">
        <h2 id="lorong-lain" className="mb-4 text-[18px] font-bold">
          Lorong lain
        </h2>
        <AisleSigns categories={tree} active={parent?.slug ?? category.slug} />
      </section>
    </div>
  );
}
