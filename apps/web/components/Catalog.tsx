import { Check, Tag, ThumbsUp, X } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { formatRupiah, type Brand, type Category, type Paginated, type ProductSummary } from '@newagung/shared';
import { hrefWith } from '@/lib/catalog-params';
import { FilterSheet } from './FilterSheet';
import { Pagination } from './Pagination';
import { ProductGrid } from './ProductCard';

type Query = Record<string, string | undefined>;

interface CatalogProps {
  /** path halaman ini, mis. /barang atau /kategori/kertas */
  base: string;
  query: Query;
  categories: Category[];
  brands: Brand[];
  /** slug kategori yang sedang dibuka (disorot di daftar) */
  activeCategory?: string;
  /** halaman merek: filter merek tidak ditampilkan */
  hideBrand?: boolean;
  /** halaman cari: ada urutan "Paling sesuai" */
  withRelevance?: boolean;
  result: Paginated<ProductSummary>;
  page: number;
  header: React.ReactNode;
  empty: React.ReactNode;
}

const SORT_TABS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlaris', label: 'Terlaris' },
  { value: 'diskon', label: 'Diskon terbesar' },
  { value: 'termurah', label: 'Harga terendah' },
  { value: 'termahal', label: 'Harga tertinggi' },
];

function SortTabs({ base, query, withRelevance }: { base: string; query: Query; withRelevance?: boolean }) {
  const current = query.sort ?? (withRelevance ? 'relevan' : 'terbaru');
  const tabs = [...(withRelevance ? [{ value: 'relevan', label: 'Paling sesuai' }] : []), ...SORT_TABS].filter((t) => t.value !== 'diskon' || query.promo);
  const defaultSort = withRelevance ? 'relevan' : 'terbaru';
  return (
    <nav aria-label="Urutkan" className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex w-max items-center gap-1.5 text-[14px]">
        <li className="mr-1 hidden text-muted sm:block">Urutkan</li>
        {tabs.map((t) => (
          <li key={t.value}>
            <Link
              href={hrefWith(base, { ...query, sort: t.value === defaultSort ? undefined : t.value })}
              aria-current={current === t.value ? 'page' : undefined}
              scroll={false}
              className="tap chip h-9 border border-line bg-surface hover:border-brand-text hover:bg-surface aria-[current=page]:border-brand aria-[current=page]:bg-brand aria-[current=page]:text-white"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FilterLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={on ? 'true' : undefined} className="group flex min-h-9 items-center gap-2.5 rounded-[8px] py-1 text-[14px] hover:text-brand-text">
      <span
        aria-hidden
        className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${on ? 'border-brand bg-brand text-white' : 'border-field bg-surface'}`}
      >
        {on && <Check size={12} weight="bold" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}

function Filters({ base, query, categories, brands, activeCategory, hideBrand, idPrefix }: Omit<CatalogProps, 'result' | 'page' | 'header' | 'empty' | 'withRelevance'> & { idPrefix: string }) {
  const without = (...keys: string[]) => Object.fromEntries(Object.entries(query).filter(([k]) => !keys.includes(k)));
  const toggle = (key: string, value: string) => hrefWith(base, { ...without(key), [key]: query[key] === value ? undefined : value });
  const brandsHere = brands.filter((b) => (b.productCount ?? 0) > 0).sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));
  const topBrands = brandsHere.slice(0, 8);
  const moreBrands = brandsHere.slice(8);
  // query lain yang tetap dibawa saat menerapkan rentang harga
  const keep = Object.entries(without('min', 'max')).filter(([, v]) => v);

  return (
    <div className="divide-y divide-line text-[14px]">
      <section aria-labelledby={`${idPrefix}-kat`} className="pb-4">
        <h2 id={`${idPrefix}-kat`} className="mb-2 font-bold">
          Kategori
        </h2>
        <ul className="space-y-0.5">
          <li>
            <Link href="/barang" aria-current={!activeCategory && base === '/barang' ? 'page' : undefined} className="block rounded-[8px] py-1.5 hover:text-brand-text aria-[current=page]:font-semibold aria-[current=page]:text-brand-text">
              Semua produk
            </Link>
          </li>
          {categories.map((c) => {
            const open = activeCategory === c.slug || c.children?.some((ch) => ch.slug === activeCategory);
            return (
              <li key={c.id}>
                <Link
                  href={`/kategori/${c.slug}`}
                  aria-current={activeCategory === c.slug ? 'page' : undefined}
                  className="flex justify-between gap-2 rounded-[8px] py-1.5 hover:text-brand-text aria-[current=page]:font-semibold aria-[current=page]:text-brand-text"
                >
                  {c.name}
                  <span className="text-[12px] text-muted tabular-nums">{c.productCount}</span>
                </Link>
                {open && !!c.children?.length && (
                  <ul className="mb-1 ml-3 border-l border-line pl-3">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link
                          href={`/kategori/${ch.slug}`}
                          aria-current={activeCategory === ch.slug ? 'page' : undefined}
                          className="flex justify-between gap-2 py-1 text-muted hover:text-brand-text aria-[current=page]:font-semibold aria-[current=page]:text-brand-text"
                        >
                          {ch.name}
                          <span className="text-[12px] tabular-nums">{ch.productCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={`${idPrefix}-tawar`} className="py-4">
        <h2 id={`${idPrefix}-tawar`} className="mb-1.5 font-bold">
          Penawaran
        </h2>
        <FilterLink href={toggle('promo', '1')} on={query.promo === '1'}>
          <span className="flex items-center gap-1.5">
            <Tag size={15} weight="fill" className="text-signal-text" aria-hidden />
            Promo
          </span>
        </FilterLink>
        <FilterLink href={toggle('pilihan', '1')} on={query.pilihan === '1'}>
          <span className="flex items-center gap-1.5">
            <ThumbsUp size={15} weight="fill" className="text-brand-text" aria-hidden />
            Pilihan toko
          </span>
        </FilterLink>
      </section>

      {!hideBrand && brandsHere.length > 0 && (
        <section aria-labelledby={`${idPrefix}-merek`} className="py-4">
          <h2 id={`${idPrefix}-merek`} className="mb-1.5 font-bold">
            Merek
          </h2>
          {topBrands.map((b) => (
            <FilterLink key={b.id} href={toggle('merek', b.slug)} on={query.merek === b.slug}>
              {b.name}
            </FilterLink>
          ))}
          {moreBrands.length > 0 && (
            <details className="group" open={moreBrands.some((b) => b.slug === query.merek)}>
              <summary className="tap cursor-pointer list-none py-1.5 font-semibold text-brand-text [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Tampilkan {moreBrands.length} merek lainnya</span>
                <span className="hidden group-open:inline">Sembunyikan</span>
              </summary>
              {moreBrands.map((b) => (
                <FilterLink key={b.id} href={toggle('merek', b.slug)} on={query.merek === b.slug}>
                  {b.name}
                </FilterLink>
              ))}
            </details>
          )}
        </section>
      )}

      <section aria-labelledby={`${idPrefix}-harga`} className="pt-4">
        <h2 id={`${idPrefix}-harga`} className="mb-2 font-bold">
          Harga
        </h2>
        <form action={base} className="space-y-2">
          {keep.map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <label className="flex h-11 items-center rounded-tag border border-field bg-surface focus-within:border-brand-text">
            <span className="border-r border-line px-2.5 text-[13px] font-semibold text-muted">Rp</span>
            <input name="min" inputMode="numeric" defaultValue={query.min} placeholder="Harga minimum" aria-label="Harga minimum" className="h-full w-full min-w-0 bg-transparent px-2.5 outline-none" />
          </label>
          <label className="flex h-11 items-center rounded-tag border border-field bg-surface focus-within:border-brand-text">
            <span className="border-r border-line px-2.5 text-[13px] font-semibold text-muted">Rp</span>
            <input name="max" inputMode="numeric" defaultValue={query.max} placeholder="Harga maksimum" aria-label="Harga maksimum" className="h-full w-full min-w-0 bg-transparent px-2.5 outline-none" />
          </label>
          <button className="btn btn-secondary w-full">Terapkan</button>
        </form>
      </section>
    </div>
  );
}

/** Chip filter aktif yang bisa dihapus satu-satu, seperti di marketplace */
function ActiveFilters({ base, query, brands }: { base: string; query: Query; brands: Brand[] }) {
  const without = (...keys: string[]) => hrefWith(base, Object.fromEntries(Object.entries(query).filter(([k]) => !keys.includes(k))));
  const chips: { label: string; href: string }[] = [];
  if (query.promo) chips.push({ label: 'Promo', href: without('promo') });
  if (query.pilihan) chips.push({ label: 'Pilihan toko', href: without('pilihan') });
  if (query.merek) chips.push({ label: brands.find((b) => b.slug === query.merek)?.name ?? query.merek, href: without('merek') });
  if (query.min || query.max) {
    const label = query.min && query.max ? `${formatRupiah(+query.min)} - ${formatRupiah(+query.max)}` : query.min ? `Mulai ${formatRupiah(+query.min)}` : `Hingga ${formatRupiah(+query.max!)}`;
    chips.push({ label, href: without('min', 'max') });
  }
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
      {chips.map((c) => (
        <li key={c.label}>
          <Link href={c.href} scroll={false} className="tap chip h-8 bg-brand-tint pr-2 text-brand-text hover:bg-brand-tint" aria-label={`Hapus filter ${c.label}`}>
            {c.label}
            <X size={14} weight="bold" aria-hidden />
          </Link>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <Link href={without('promo', 'pilihan', 'merek', 'min', 'max')} scroll={false} className="tap text-[13px] font-semibold text-brand-text hover:underline">
            Hapus semua filter
          </Link>
        </li>
      )}
    </ul>
  );
}

/**
 * Tata letak daftar barang gaya marketplace: kolom filter di kiri (layar lebar) atau
 * panel "Filter" yang bisa dibuka (HP), urutan berupa tab, lalu grid barang.
 * Semua filter berupa tautan/form GET, jadi tetap jalan tanpa JavaScript.
 */
export function Catalog(props: CatalogProps) {
  const { base, query, brands, result, page, header, empty, withRelevance } = props;
  const filterCount = ['promo', 'pilihan', 'merek', 'min'].filter((k) => query[k] || (k === 'min' && query.max)).length;

  return (
    <div className="mt-4 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-6">
      <aside aria-label="Filter produk" className="hidden lg:block">
        <div className="card p-4">
          <Filters {...props} idPrefix="f" />
        </div>
      </aside>

      <div className="min-w-0">
        {header}

        <div className="mt-3 flex items-center gap-2">
          <div className="lg:hidden">
            <FilterSheet count={filterCount} total={result.total}>
              <Filters {...props} idPrefix="fm" />
            </FilterSheet>
          </div>
          <div className="min-w-0 flex-1">
            <SortTabs base={base} query={query} withRelevance={withRelevance} />
          </div>
        </div>

        <div className="mt-3">
          <ActiveFilters base={base} query={query} brands={brands} />
        </div>

        <div className="mt-3">{result.items.length ? <ProductGrid products={result.items} priorityCount={2} /> : empty}</div>
        <Pagination page={page} pageSize={result.pageSize} total={result.total} makeHref={(p) => hrefWith(base, { ...query, page: p })} />
      </div>
    </div>
  );
}
