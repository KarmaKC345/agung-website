import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Storefront, WhatsappLogo } from '@phosphor-icons/react/ssr';
import { notFound } from 'next/navigation';
import { waLink } from '@newagung/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ProductRow } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { ProductPurchase } from '@/components/ProductPurchase';
import { getProduct, getProducts, getStore } from '@/lib/api';
import { SITE_URL } from '@/lib/config';

type Props = { params: Promise<{ slug: string }> };


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

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-12">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="card relative overflow-hidden rounded-[var(--radius-media)] p-3">
            {product.images[0] ? (
              <div className="relative aspect-square overflow-hidden rounded-[14px] bg-white">
                <Image src={product.images[0]} alt={product.name} fill priority sizes="(min-width: 768px) 560px, 100vw" className="object-contain p-6" />
              </div>
            ) : (
              <ProductImage src={null} name={product.name} categorySlug={product.category?.slug} sizes="560px" className="rounded-[14px]" />
            )}
            <FavoriteButton productId={product.id} name={product.name} className="absolute top-6 right-6" />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2">
              {product.images.slice(1).map((src) => (
                <li key={src} className="card relative aspect-square overflow-hidden bg-white">
                  <Image src={src} alt="" fill sizes="110px" className="object-contain p-1.5" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {product.brand && (
            <Link href={`/merek/${product.brand.slug}`} className="tap text-[14px] font-semibold text-brand-text hover:underline">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-[26px] leading-[1.15] font-bold tracking-[-0.02em] text-balance sm:text-[32px]">{product.name}</h1>
          {product.description && <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-muted">{product.description}</p>}

          <ProductPurchase product={product} />

          <ul className="mt-8 space-y-3 border-t border-line pt-5 text-[14px] text-muted">
            <li className="flex gap-3">
              <Storefront size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <span>Ambil di Jl. DR. Ratulangi No.52 atau minta diantar. Harga akhir dan stok dikonfirmasi toko saat memesan.</span>
            </li>
            <li className="flex gap-3">
              <Clock size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <span>Harga diperbarui {updatedFmt.format(new Date(product.updatedAt))}.</span>
            </li>
            <li className="flex gap-3">
              <WhatsappLogo size={20} className="mt-0.5 shrink-0 text-wa-text" aria-hidden />
              <a
                href={waLink(store.whatsapp, `Halo New Agung, saya mau tanya tentang ${product.name}.`)}
                target="_blank"
                rel="noopener"
                className="tap font-semibold text-wa-text underline underline-offset-4"
              >
                Tanya barang ini lewat WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="serak">
          <h2 id="serak" className="mb-4 text-[20px] font-bold tracking-[-0.01em]">
            Satu rak dengan barang ini
          </h2>
          <ProductRow products={related} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
