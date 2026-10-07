import type { MetadataRoute } from 'next';
import type { Category, Paginated, ProductSummary } from '@newagung/shared';
import { API_URL, SITE_URL } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const opts = { next: { revalidate: 3600, tags: ['products', 'categories'] } };
  const [cats, firstPage] = await Promise.all([
    fetch(`${API_URL}/api/categories`, opts).then((r) => r.json() as Promise<Category[]>),
    fetch(`${API_URL}/api/products?pageSize=60`, opts).then((r) => r.json() as Promise<Paginated<ProductSummary>>),
  ]);
  const pages = Math.ceil(firstPage.total / 60);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.min(pages, 200) - 1) }, (_, i) =>
      fetch(`${API_URL}/api/products?pageSize=60&page=${i + 2}`, opts).then((r) => r.json() as Promise<Paginated<ProductSummary>>),
    ),
  );
  const products = [firstPage, ...rest].flatMap((p) => p.items);
  const allCats = cats.flatMap((c) => [c, ...(c.children ?? [])]);

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/kategori`, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/tentang`, changeFrequency: 'monthly' },
    ...allCats.map((c) => ({ url: `${SITE_URL}/kategori/${c.slug}`, changeFrequency: 'weekly' as const })),
    ...products.map((p) => ({ url: `${SITE_URL}/barang/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
