import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { formatPhone, summarizeHours, waLink } from '@newagung/shared';
import { AisleSigns } from '@/components/AisleSigns';
import { ProductGrid } from '@/components/ProductCard';
import { SearchBox } from '@/components/SearchBox';
import { StatusPill } from '@/components/StatusPill';
import { getCategories, getProducts, getStore } from '@/lib/api';
import lorong from '@/public/foto/lorong-kertas.webp';
import papan from '@/public/foto/papan-lorong.webp';

export const revalidate = 300;

export default async function HomePage() {
  const [store, categories, latest, kertas] = await Promise.all([
    getStore(),
    getCategories(),
    getProducts({ sort: 'terbaru', pageSize: 10 }),
    getProducts({ category: 'kertas', sort: 'termurah', pageSize: 5 }),
  ]);
  const hours = summarizeHours(store.openingHours);

  return (
    <>
      {/* Pembuka: foto lorong asli + kotak cari */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl md:grid-cols-[1fr_1.1fr] md:gap-10 md:px-4 md:py-10">
          <div className="relative aspect-[4/3] md:order-2 md:aspect-auto md:min-h-[420px]">
            <Image
              src={lorong}
              alt="Lorong kertas warna dan map di dalam Toko New Agung"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover md:rounded-tag"
            />
          </div>
          <div className="flex flex-col justify-center px-4 py-6 md:px-0 md:py-0">
            <StatusPill hours={store.openingHours} timezone={store.timezone} className="text-muted" />
            <h1 className="condensed mt-3 text-[40px] leading-[0.95] font-[800] tracking-[-0.015em] sm:text-[52px]">
              Rak New Agung,
              <br />
              <span className="text-brand-text">dari HP.</span>
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
              Cek harga dan warna barang, kirim daftar belanja lewat WhatsApp, lalu ambil di Jl. DR. Ratulangi No.52.
            </p>
            <div className="mt-6 hidden max-w-lg md:block">
              <Suspense>
                <SearchBox large />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10" aria-labelledby="lorong">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="lorong" className="text-[20px] font-bold">
              Pilih lorong
            </h2>
            <Link href="/kategori" className="tap text-[14px] font-semibold text-brand-text hover:underline">
              Semua kategori
            </Link>
          </div>
          <AisleSigns categories={categories} />
        </section>

        <section className="mt-12" aria-labelledby="baru">
          <h2 id="baru" className="mb-4 text-[20px] font-bold">
            Baru masuk rak
          </h2>
          <ProductGrid products={latest.items} priorityCount={2} />
        </section>

        {kertas.items.length > 0 && (
          <section className="mt-12" aria-labelledby="kertas">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="kertas" className="text-[20px] font-bold">
                Kertas per rim & box
              </h2>
              <Link href="/kategori/kertas" className="tap text-[14px] font-semibold text-brand-text hover:underline">
                Lorong kertas
              </Link>
            </div>
            <ProductGrid products={kertas.items} />
          </section>
        )}

        {/* Info toko */}
        <section className="mt-14 grid overflow-hidden rounded-tag border border-line bg-surface md:grid-cols-2" aria-labelledby="kunjungi">
          <div className="relative aspect-[5/2] md:aspect-auto">
            <Image
              src={papan}
              alt="Papan gantung lorong Spidol/Stabilo dan Cat Poster/Lem di Toko New Agung"
              fill
              placeholder="blur"
              sizes="(min-width: 768px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-5 md:p-8">
            <h2 id="kunjungi" className="text-[20px] font-bold">
              Datang ke toko
            </h2>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div>
                <dt className="signage text-[12px] text-muted">Alamat</dt>
                <dd className="mt-0.5">{store.address}</dd>
              </div>
              {hours && (
                <div>
                  <dt className="signage text-[12px] text-muted">Jam buka</dt>
                  <dd className="mt-0.5">{hours} WITA</dd>
                </div>
              )}
              <div>
                <dt className="signage text-[12px] text-muted">Ulasan Google</dt>
                <dd className="mt-0.5">
                  <a href={store.mapsUrl} target="_blank" rel="noopener" className="tap underline underline-offset-4">
                    4,5 dari 10.000+ ulasan
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={store.mapsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center rounded-tag bg-ink px-4 text-[15px] font-semibold text-surface"
              >
                Rute ke toko
              </a>
              <a
                href={waLink(store.whatsapp)}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center rounded-tag border border-wa-text px-4 text-[15px] font-semibold text-wa-text"
              >
                WhatsApp {formatPhone(store.whatsapp)}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
