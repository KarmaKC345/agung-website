'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const SORTS = [
  { value: '', label: 'Terbaru' },
  { value: 'termurah', label: 'Termurah' },
  { value: 'termahal', label: 'Termahal' },
  { value: 'az', label: 'Nama A–Z' },
];

export function SortSelect({ withRelevance = false }: { withRelevance?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const options = withRelevance ? [{ value: '', label: 'Paling cocok' }, ...SORTS.slice(0, 1).map((s) => ({ ...s, value: 'terbaru' })), ...SORTS.slice(1)] : SORTS;

  return (
    <label className="flex items-center gap-2 text-[14px]">
      <span className="text-muted">Urutkan</span>
      <select
        value={params.get('sort') ?? ''}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set('sort', e.target.value);
          else next.delete('sort');
          next.delete('page');
          router.push(`${path}?${next.toString()}`, { scroll: false });
        }}
        className="h-9 rounded-tag border border-line-strong bg-surface px-2 font-medium"
      >
        {options.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
