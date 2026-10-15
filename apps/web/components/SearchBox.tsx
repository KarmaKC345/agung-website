'use client';

import { Clock, MagnifyingGlass, Trash, TrendUp, X } from '@phosphor-icons/react';
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

const RECENT_KEY = 'newagung_recent_searches';
const TRENDING_SEARCHES = [
  'Kalkulator Casio',
  'Binder Bantex',
  'Spidol Snowman',
  'Kertas HVS A4',
  'Buku Tulis Sidu',
  'Pulpen Pilot G2',
];

export function SearchBox({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const listId = useId();
  const boxRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil pencarian terakhir dari localStorage saat client hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, 6));
      }
    } catch {}
  }, []);

  function saveRecent(term: string) {
    const clean = term.trim();
    if (!clean) return;
    try {
      const next = [clean, ...recent.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function removeRecent(term: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const next = recent.filter((s) => s !== term);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function clearAllRecent(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      setRecent([]);
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (
        (e.key === '/' && !isInput) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  function go(href: string, recordQuery?: string) {
    if (recordQuery) saveRecent(recordQuery);
    setOpen(false);
    router.push(href);
  }

  function pickQuery(term: string) {
    setQ(term);
    go(`/cari?q=${encodeURIComponent(term)}`, term);
  }

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const pick = items[active];
        if (open && pick) return go(HREF[pick.type](pick.slug), pick.label);
        const term = q.trim();
        if (term) go(`/cari?q=${encodeURIComponent(term)}`, term);
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Cari produk
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-tag border border-field bg-surface focus-within:border-brand-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-text ${
          large ? 'h-12 pr-1.5 pl-4 text-[15px]' : 'h-12 px-3.5 text-[15px]'
        }`}
      >
        <MagnifyingGlass size={18} weight="bold" className="shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          value={q}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Cari produk, merek, atau kategori…"
          className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-muted"
          role="combobox"
          aria-expanded={open}
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
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setItems([]);
              inputRef.current?.focus();
            }}
            aria-label="Hapus kata kunci pencarian"
            className="tap grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink"
          >
            <X size={15} weight="bold" aria-hidden />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center rounded border border-line bg-sunken px-1.5 py-0.5 text-[11px] font-mono text-muted select-none" title="Pintasan keyboard: tekan / untuk mencari">
            /
          </kbd>
        )}
        {large && (
          <button type="submit" className="btn btn-primary hidden h-9 min-h-0 shrink-0 px-5 text-sm sm:inline-flex">
            Cari
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-tag border border-line bg-surface shadow-[0_16px_36px_-12px_rgb(var(--shadow-tint)/0.4)]"
        >
          {items.length > 0 ? (
            /* Saran kata kunci instan dari backend */
            <ul>
              {items.map((s, i) => (
                <li key={`${s.type}-${s.slug}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(HREF[s.type](s.slug), s.label)}
                    className={`flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left text-[14px] ${
                      i === active ? 'bg-brand-tint text-brand-text' : 'hover:bg-sunken text-ink'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    {KIND[s.type] && <span className="shrink-0 text-[11px] text-muted">{KIND[s.type]}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : !q.trim() ? (
            /* Popover awal: Pencarian Terakhir & Populer */
            <div className="p-3.5 space-y-3.5">
              {/* Bagian 1: Pencarian Terakhir */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[12px] font-semibold text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} weight="bold" /> Pencarian Terakhir
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearAllRecent}
                      className="text-[11px] text-muted hover:text-danger hover:underline"
                    >
                      Hapus semua
                    </button>
                  </div>

                  <ul className="mt-2 divide-y divide-line/60">
                    {recent.map((term) => (
                      <li key={term} className="flex items-center justify-between group">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickQuery(term)}
                          className="flex flex-1 items-center gap-2 py-1.5 text-left text-[13px] text-ink hover:text-brand-text"
                        >
                          <Clock size={13} className="text-muted shrink-0" />
                          <span className="truncate">{term}</span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => removeRecent(term, e)}
                          aria-label={`Hapus ${term} dari riwayat`}
                          className="p-1 text-muted hover:text-danger opacity-70 group-hover:opacity-100"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bagian 2: Pencarian Populer / Trending */}
              <div>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <TrendUp size={14} weight="bold" className="text-brand" /> Pencarian Populer
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickQuery(term)}
                      className="tap rounded-full border border-line bg-sunken/60 px-3 py-1 text-[12px] font-medium text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-text transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </form>
  );
}
