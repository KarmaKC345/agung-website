import Link from 'next/link';
import type { Category } from '@newagung/shared';

/** "Spidol & Stabilo" → "Spidol/Stabilo", seperti tulisan papan lorong di toko */
export function signText(name: string): string {
  return name.replace(/\s*(&|,)\s*/g, '/');
}

function Sign({ c, active }: { c: Category; active?: string }) {
  return (
    <Link href={`/kategori/${c.slug}`} aria-current={active === c.slug ? 'page' : undefined} className="aisle-sign text-center">
      <span className="signage block text-[13px] sm:text-[14px]">{signText(c.name)}</span>
      <span className="mt-1 block text-[11px] text-muted tabular-nums [[aria-current=page]_&]:text-surface/70">
        {c.productCount} barang
      </span>
    </Link>
  );
}

/**
 * Kategori ditampilkan sebagai papan gantung lorong. HP: satu rel yang bisa digeser.
 * Layar lebar: beberapa rel, masing-masing 5 papan.
 */
export function AisleSigns({ categories, active }: { categories: Category[]; active?: string }) {
  const rows: Category[][] = [];
  for (let i = 0; i < categories.length; i += 5) rows.push(categories.slice(i, i + 5));

  return (
    <nav aria-label="Kategori (papan lorong)">
      <div className="scrollbar-none -mx-4 overflow-x-auto px-4 md:hidden">
        <ul className="aisle-rail flex w-max gap-3 pb-1">
          {categories.map((c) => (
            <li key={c.id} className="w-[150px] shrink-0">
              <Sign c={c} active={active} />
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden space-y-5 md:block">
        {rows.map((row, i) => (
          <ul key={i} className="aisle-rail grid grid-cols-5 gap-4">
            {row.map((c) => (
              <li key={c.id}>
                <Sign c={c} active={active} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </nav>
  );
}
