import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { waLink } from '@newagung/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ProductGrid } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { ProductPurchase } from '@/components/ProductPurchase';
import { getProduct, getProducts, getStore } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

// halaman barang dibuat saat pertama dikunjungi lalu disimpan (ISR), tidak saat build
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const min = Math.min(...p.variants.flatMap((v) => v.prices.map((x) => x.price)));
  return {
    title: p.name,
    description: `${p.name}${p.brand ? ` (${p.brand.name})` : ''} mulai Rp${min.toLocaleString('id-ID')} di Toko New Agung Makassar. ${p.description}`.trim(),
    alternates: { canonical: `/barang/${p.slug}` },
    openGraph: p.images[0] ? { images: [p.images[0]] } : undefined,
  };
}

const updatedFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, store] = await Promise.all([getProduct(slug), getStore()]);
  if (!product) notFound();

  const related = product.category
    ? (await getProducts({ category: product.category.slug, pageSize: 6 })).items.filter((p) => p.id !== product.id).slice(0, 5)
    : [];
  const crumbs = [
    ...(product.category?.parent ? [{ href: `/kategori/${product.category.parent.slug}`, label: product.category.parent.name }] : []),
    ...(product.category ? [{ href: `/kategori/${product.category.slug}`, label: product.category.name }] : []),
    { label: product.name },
  ];

  const prices = product.variants.flatMap((v) => v.prices.map((p) => p.price));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images.length ? product.images : undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    url: `${SITE_URL}/barang/${product.slug}`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      availability: product.variants.some((v) => v.stockStatus !== 'habis') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <Breadcrumbs items={crumbs} />

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
        <div>
          <div className="relative overflow-hidden rounded-tag border border-line">
            {product.images[0] ? (
              <div className="relative aspect-square bg-white">
                <Image src={product.images[0]} alt={product.name} fill priority sizes="(min-width: 768px) 560px, 100vw" className="object-contain p-4" />
              </div>
            ) : (
              <ProductImage src={null} name={product.name} brand={product.brand?.name ?? null} sizes="560px" />
            )}
            <FavoriteButton productId={product.id} name={product.name} className="absolute top-3 right-3" />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2">
              {product.images.slice(1).map((src) => (
                <li key={src} className="relative aspect-square overflow-hidden rounded-tag border border-line bg-white">
                  <Image src={src} alt="" fill sizes="110px" className="object-contain p-1" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {product.brand && (
            <a href={`/merek/${product.brand.slug}`} className="signage text-[13px] text-brand-text hover:underline">
              {product.brand.name}
            </a>
          )}
          <h1 className="mt-1 text-[26px] leading-tight font-bold sm:text-[30px]">{product.name}</h1>
          {product.description && <p className="mt-3 max-w-prose leading-relaxed text-muted">{product.description}</p>}

          <ProductPurchase product={product} />

          <div className="mt-6 border-t border-line pt-4 text-[14px] text-muted">
            <p>
              Harga diperbarui {updatedFmt.format(new Date(product.updatedAt))}. Harga akhir dan stok dikonfirmasi toko saat memesan.
            </p>
            <a
              href={waLink(store.whatsapp, `Halo New Agung, saya mau tanya tentang ${product.name}.`)}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block font-semibold text-wa-text underline underline-offset-4"
            >
              Tanya barang ini via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="serak">
          <h2 id="serak" className="mb-4 text-[20px] font-bold">
            Satu rak dengan barang ini
          </h2>
          <ProductGrid products={related} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
