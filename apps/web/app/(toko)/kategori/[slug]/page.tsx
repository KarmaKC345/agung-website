import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Catalog } from '@/components/Catalog';
import { CategoryIcon } from '@/components/CategoryIcon';
import { findCategory, getBrands, getCategories, getProducts } from '@/lib/api';
import { currentQuery, hrefWith, toListParams, type CatalogSearch } from '@/lib/catalog-params';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogSearch>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = findCategory(await getCategories(), slug);
  if (!found) return {};
  return {
    title: found.category.name,
    description: `Daftar harga ${found.category.name.toLowerCase()} di Toko New Agung Makassar. Pesan melalui WhatsApp dan ambil di Jl. DR. Ratulangi No.52.`,
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
  const list = { ...toListParams(sp), category: slug };
  const result = await getProducts({ ...list, pageSize: 30 });
  const query = currentQuery(sp, list);
  const siblings = parent ? (parent.children ?? []) : (category.children ?? []);
  // pindah sub-kategori tetap membawa filter yang sedang dipakai
  const subHref = (s: string) => hrefWith(`/kategori/${s}`, query);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs
        items={[{ href: '/kategori', label: 'Kategori' }, ...(parent ? [{ href: `/kategori/${parent.slug}`, label: parent.name }] : []), { label: category.name }]}
      />
      <Catalog
        base={`/kategori/${slug}`}
        query={query}
        categories={tree}
        brands={brands}
        activeCategory={slug}
        result={result}
        page={list.page}
        header={
          <>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-text">
                <CategoryIcon slug={slug} size={24} weight="duotone" aria-hidden />
              </span>
              <h1 className="text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">
                {category.name} <span className="text-[15px] font-normal text-muted tabular-nums">{result.total} produk</span>
              </h1>
            </div>
            {siblings.length > 0 && (
              <nav aria-label="Sub-kategori" className="scrollbar-none -mx-4 mt-3 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                <ul className="flex w-max gap-2">
                  <li>
                    <Link href={subHref(parent?.slug ?? category.slug)} aria-current={!parent ? 'page' : undefined} className="tap chip">
                      Semua {(parent ?? category).name.toLowerCase()}
                    </Link>
                  </li>
                  {siblings.map((c) => (
                    <li key={c.id}>
                      <Link href={subHref(c.slug)} aria-current={c.slug === slug ? 'page' : undefined} className="tap chip">
                        {c.name}
                        <span className="text-[12px] opacity-60 tabular-nums">{c.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </>
        }
        empty={
          <p className="card rounded-[var(--radius-media)] p-8 text-center text-muted">
            Belum ada produk {category.name.toLowerCase()} yang sesuai dengan filter Anda. Silakan ubah atau hapus filter.
          </p>
        }
      />
    </div>
  );
}
