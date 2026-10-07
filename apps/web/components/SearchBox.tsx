'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';

interface Suggestion {
  type: 'product' | 'category' | 'brand';
  label: string;
  slug: string;
}

const HREF: Record<Suggestion['type'], (s: string) => string> = {
  product: (s) => `/barang/${s}`,
  category: (s) => `/kategori/${s}`,
  brand: (s) => `/merek/${s}`,
};
const KIND: Record<Suggestion['type'], string> = { product: '', category: 'Kategori', brand: 'Merek' };

export function SearchBox({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`${API_URL}/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Suggestion[]) => {
          setItems(data);
          setActive(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const pick = items[active];
        if (open && pick) return go(HREF[pick.type](pick.slug));
        const term = q.trim();
        if (term) go(`/cari?q=${encodeURIComponent(term)}`);
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Cari barang
      </label>
      <div
        className={`flex items-center gap-2 rounded-tag border border-line-strong bg-surface focus-within:border-brand-text ${
          large ? 'h-14 px-4 text-[17px]' : 'h-11 px-3 text-[15px]'
        }`}
      >
        <svg viewBox="0 0 20 20" className="size-[18px] shrink-0 text-muted" aria-hidden>
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={`${listId}-input`}
          type="search"
          value={q}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Cari pulpen, kertas A4, map, tinta…"
          className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!items.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {large && (
          <button type="submit" className="hidden h-10 shrink-0 rounded-tag bg-ink px-4 text-sm font-semibold text-surface sm:block">
            Cari
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-tag border border-line-strong bg-surface shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)]"
        >
          {items.map((s, i) => (
            <li key={`${s.type}-${s.slug}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(HREF[s.type](s.slug))}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-[15px] ${
                  i === active ? 'bg-brand-tint' : 'hover:bg-sunken'
                }`}
              >
                <span className="truncate">{s.label}</span>
                {KIND[s.type] && <span className="shrink-0 text-xs text-muted">{KIND[s.type]}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
