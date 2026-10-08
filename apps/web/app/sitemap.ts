import type { MetadataRoute } from 'next';
import type { Category, Paginated, ProductSummary } from '@newagung/shared';
import { connection } from 'next/server';
import { SERVER_API_URL as API_URL, SITE_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // dibuat saat diminta (data tetap di-cache 1 jam), jadi build tidak butuh API menyala
  await connection();
  const opts = { next: { revalidate: 3600, tags: ['products', 'categories'] } };
  const baseUrl = (process.env.API_INTERNAL_URL || API_URL).replace(/\/$/, '');
  const toApiUrl = (p: string) => new URL(p.startsWith('/') ? p.slice(1) : p, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  const [cats, firstPage] = await Promise.all([
    fetch(toApiUrl('api/categories'), opts).then((r) => r.json() as Promise<Category[]>),
    fetch(toApiUrl('api/products?pageSize=60'), opts).then((r) => r.json() as Promise<Paginated<ProductSummary>>),
  ]);
  const pages = Math.ceil(firstPage.total / 60);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.min(pages, 200) - 1) }, (_, i) =>
      fetch(toApiUrl(`api/products?pageSize=60&page=${i + 2}`), opts).then((r) => r.json() as Promise<Paginated<ProductSummary>>),
    ),
  );
  const products = [firstPage, ...rest].flatMap((p) => p.items);
  const allCats = cats.flatMap((c) => [c, ...(c.children ?? [])]);

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/kategori`, changeFrequency: 'weekly' },
    { url: `${SITE_URL}/barang`, changeFrequency: 'daily' },
    { url: `${SITE_URL}/tentang`, changeFrequency: 'monthly' },
    ...allCats.map((c) => ({ url: `${SITE_URL}/kategori/${c.slug}`, changeFrequency: 'weekly' as const })),
    ...products.map((p) => ({ url: `${SITE_URL}/barang/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
