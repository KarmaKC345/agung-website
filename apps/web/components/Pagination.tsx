import Link from 'next/link';

export function Pagination({
  page,
  pageSize,
  total,
  makeHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const btn = 'inline-flex h-10 items-center rounded-tag border border-line-strong bg-surface px-4 font-semibold hover:border-ink';
  return (
    <nav aria-label="Halaman" className="mt-8 flex items-center justify-center gap-3 text-[15px]">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={btn} rel="prev">
          ← Sebelumnya
        </Link>
      ) : null}
      <span className="text-muted tabular-nums">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} className={btn} rel="next">
          Berikutnya →
        </Link>
      ) : null}
    </nav>
  );
}

export function hrefWith(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
