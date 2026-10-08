import type { ListParams } from './api';

/** Parameter URL halaman daftar barang (nama pendek, berbahasa Indonesia di URL) */
export interface CatalogSearch {
  sort?: string;
  merek?: string;
  min?: string;
  max?: string;
  promo?: string;
  pilihan?: string;
  featured?: string;
  page?: string;
  q?: string;
}

const SORTS = new Set(['relevan', 'terbaru', 'terlaris', 'diskon', 'termurah', 'termahal', 'az']);

const toInt = (v: string | undefined) => {
  const n = Number(String(v ?? '').replace(/\D/g, ''));
  return v && Number.isFinite(n) && n > 0 ? Math.min(n, 100_000_000) : undefined;
};
const flag = (v: string | undefined) => v === '1' || v === 'true';

/** URL → parameter API. Nilai asing dibuang agar URL rusak tidak membuat halaman error. */
export function toListParams(sp: CatalogSearch): ListParams & { page: number } {
  let minPrice = toInt(sp.min);
  let maxPrice = toInt(sp.max);
  if (minPrice && maxPrice && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  return {
    sort: sp.sort && SORTS.has(sp.sort) ? sp.sort : undefined,
    brand: sp.merek && /^[a-z0-9-]{1,80}$/.test(sp.merek) ? sp.merek : undefined,
    minPrice,
    maxPrice,
    promo: flag(sp.promo) || undefined,
    featured: flag(sp.pilihan) || flag(sp.featured) || undefined,
    page: Math.min(1000, Math.max(1, Number(sp.page) || 1)),
  };
}

/** Parameter URL yang sedang berlaku (untuk membangun tautan filter/urutan/halaman) */
export function currentQuery(sp: CatalogSearch, p: ListParams): Record<string, string | undefined> {
  return {
    q: sp.q,
    merek: p.brand,
    min: p.minPrice ? String(p.minPrice) : undefined,
    max: p.maxPrice ? String(p.maxPrice) : undefined,
    promo: p.promo ? '1' : undefined,
    pilihan: p.featured ? '1' : undefined,
    sort: p.sort,
  };
}

export function hrefWith(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}
