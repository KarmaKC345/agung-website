import 'server-only';
import type { Brand, Category, Paginated, ProductDetail, ProductSummary, StoreInfo } from '@newagung/shared';
import { SERVER_API_URL } from './config';

const REVALIDATE = 300;

async function get<T>(path: string, tags: string[], revalidate = REVALIDATE): Promise<T | null> {
  const res = await fetch(`${SERVER_API_URL}/api${path}`, { next: { revalidate, tags } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const getStore = async () => (await get<StoreInfo>('/store', ['store']))!;
export const getCategories = async () => (await get<Category[]>('/categories', ['categories'])) ?? [];
export const getBrands = async () => (await get<Brand[]>('/brands', ['brands'])) ?? [];

export interface ListParams {
  category?: string;
  brand?: string;
  q?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export async function getProducts(params: ListParams): Promise<Paginated<ProductSummary>> {
  const path = params.q ? '/search' : '/products';
  return (await get<Paginated<ProductSummary>>(`${path}${qs({ ...params })}`, ['products'], params.q ? 60 : REVALIDATE))!;
}

export const getProduct = (slug: string) =>
  get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, ['products', `product:${slug}`]);

/** Cari kategori (induk atau anak) beserta induknya */
export function findCategory(tree: Category[], slug: string): { category: Category; parent: Category | null } | null {
  for (const c of tree) {
    if (c.slug === slug) return { category: c, parent: null };
    const child = c.children?.find((ch) => ch.slug === slug);
    if (child) return { category: child, parent: c };
  }
  return null;
}
