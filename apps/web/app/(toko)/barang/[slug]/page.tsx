import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Storefront, ThumbsUp } from '@phosphor-icons/react/ssr';
import { notFound } from 'next/navigation';
import { waLink } from '@newagung/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ProductRow, soldLabel } from '@/components/ProductCard';
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
    description: `${p.name}${p.brand ? ` (${p.brand.name})` : ''} mulai Rp${min.toLocaleString('id-ID')} di Toko New Agung, Makassar. ${p.description}`.trim(),
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
    ? (await getProducts({ category: product.category.slug, pageSize: 7 })).items.filter((p) => p.id !== product.id).slice(0, 6)
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

  const waHref = waLink(store.whatsapp, `Halo Toko New Agung, saya ingin menanyakan produk ${product.name}.`);
  const anyStock = product.variants.some((v) => v.stockStatus !== 'habis');

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-20 lg:pb-0">
      <Breadcrumbs items={crumbs} />

      <div className="mt-4 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-[148px] lg:self-start">
          <div className="card relative overflow-hidden">
            {product.images[0] ? (
              <div className="relative aspect-square bg-white">
                <Image src={product.images[0]} alt={product.name} fill priority sizes="(min-width: 1280px) 400px, (min-width: 1024px) 340px, 100vw" className="object-contain p-6" />
              </div>
            ) : (
              <ProductImage src={null} name={product.name} categorySlug={product.category?.slug} sizes="400px" />
            )}
            <FavoriteButton productId={product.id} name={product.name} className="absolute top-3 right-3" />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-2 grid grid-cols-5 gap-2">
              {product.images.slice(1).map((src) => (
                <li key={src} className="card relative aspect-square overflow-hidden bg-white">
                  <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <ProductPurchase
          product={product}
          waHref={waHref}
          head={
            <>
              <h1 className="text-[20px] leading-[1.25] font-bold tracking-[-0.015em] text-balance sm:text-[24px]">{product.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
                {product.brand && (
                  <>
                    <span>
                      Merek{' '}
                      <Link href={`/merek/${product.brand.slug}`} className="font-semibold text-brand-text hover:underline">
                        {product.brand.name}
                      </Link>
                    </span>
                    <span aria-hidden>·</span>
                  </>
                )}
                {product.sold > 0 && (
                  <>
                    <span>{soldLabel(product.sold)}</span>
                    <span aria-hidden>·</span>
                  </>
                )}
                <span className={anyStock ? 'text-ok' : 'text-danger'}>{anyStock ? 'Stok tersedia' : 'Stok habis'}</span>
                {product.isFeatured && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-[12px] font-semibold text-brand-text">
                    <ThumbsUp size={12} weight="fill" aria-hidden />
                    Pilihan toko
                  </span>
                )}
              </p>
            </>
          }
        >
          {product.description && (
            <section aria-labelledby="ket">
              <h2 id="ket" className="text-[16px] font-bold">
                Deskripsi produk
              </h2>
              <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
            </section>
          )}
          <ul className="mt-6 space-y-3 rounded-tag bg-sunken/70 p-4 text-[14px] text-muted">
            <li className="flex gap-3">
              <Storefront size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <span>
                <span className="font-semibold text-ink">Ambil di toko</span> di Jl. DR. Ratulangi No.52, Makassar, atau pilih diantar. Harga akhir dan ketersediaan stok dikonfirmasi oleh toko melalui WhatsApp.
              </span>
            </li>
            <li className="flex gap-3">
              <Clock size={20} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <span>Harga terakhir diperbarui pada {updatedFmt.format(new Date(product.updatedAt))}.</span>
            </li>
          </ul>
        </ProductPurchase>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="serak">
          <h2 id="serak" className="mb-3 text-[18px] font-bold tracking-[-0.015em] sm:text-[20px]">
            Produk serupa
          </h2>
          <ProductRow products={related} />
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
