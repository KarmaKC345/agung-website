import type { Metadata } from 'next';
import Link from 'next/link';
import { signText } from '@/components/AisleSigns';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getBrands, getCategories } from '@/lib/api';

export const metadata: Metadata = { title: 'Semua kategori' };
export const revalidate = 300;

export default async function CategoriesPage() {
  const [tree, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <Breadcrumbs items={[{ label: 'Kategori' }]} />
      <h1 className="mt-4 text-[28px] font-bold">Semua lorong</h1>

      <ul className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {tree.map((c) => (
          <li key={c.id} className="aisle-rail">
            <Link href={`/kategori/${c.slug}`} className="aisle-sign">
              <span className="flex items-baseline justify-between gap-3">
                <span className="signage text-[15px]">{signText(c.name)}</span>
                <span className="text-[12px] text-muted tabular-nums">{c.productCount}</span>
              </span>
            </Link>
            {c.children && c.children.length > 0 && (
              <ul className="mt-2 space-y-0.5 pl-3 text-[15px]">
                {c.children.map((ch) => (
                  <li key={ch.id}>
                    <Link href={`/kategori/${ch.slug}`} className="flex justify-between py-1 hover:underline">
                      {ch.name}
                      <span className="text-muted tabular-nums">{ch.productCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-[20px] font-bold">Merek</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {brands
          .filter((b) => (b.productCount ?? 0) > 0)
          .map((b) => (
            <li key={b.id}>
              <Link
                href={`/merek/${b.slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-tag border border-line-strong bg-surface px-3.5 text-[15px] font-semibold hover:border-ink"
              >
                {b.name}
                <span className="text-[12px] font-normal text-muted tabular-nums">{b.productCount}</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
