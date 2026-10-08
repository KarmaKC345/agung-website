import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';
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
  return (
    <nav aria-label="Halaman" className="mt-10 flex items-center justify-center gap-3 text-[15px]">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="btn btn-secondary" rel="prev">
          <CaretLeft size={16} weight="bold" aria-hidden />
          Sebelumnya
        </Link>
      ) : null}
      <span className="px-2 text-muted tabular-nums">
        Halaman {page} dari {pages}
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} className="btn btn-secondary" rel="next">
          Berikutnya
          <CaretRight size={16} weight="bold" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
