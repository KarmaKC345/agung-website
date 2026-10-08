import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CategoryIcon } from '@/components/CategoryIcon';
import { getBrands, getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Semua kategori', alternates: { canonical: '/kategori' } };

export default async function CategoriesPage() {
  const [tree, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ label: 'Kategori' }]} />
      <h1 className="mt-4 text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">Semua kategori</h1>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tree.map((c) => (
          <li key={c.id} className="card p-4">
            <Link href={`/kategori/${c.slug}`} className="group flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-text">
                <CategoryIcon slug={c.slug} size={26} weight="duotone" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold group-hover:text-brand-text">{c.name}</span>
                <span className="block text-[13px] text-muted tabular-nums">{c.productCount} produk</span>
              </span>
            </Link>
            {c.children && c.children.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                {c.children.map((ch) => (
                  <li key={ch.id}>
                    <Link href={`/kategori/${ch.slug}`} className="tap chip h-8 text-[13px]">
                      {ch.name}
                      <span className="text-[11px] text-muted tabular-nums">{ch.productCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-[18px] font-bold tracking-[-0.015em] sm:text-[20px]">Merek</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {brands
          .filter((b) => (b.productCount ?? 0) > 0)
          .map((b) => (
            <li key={b.id}>
              <Link href={`/merek/${b.slug}`} className="tap chip border border-line bg-surface hover:border-brand-text hover:bg-surface hover:text-brand-text">
                {b.name}
                <span className="text-[12px] text-muted tabular-nums">{b.productCount}</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
