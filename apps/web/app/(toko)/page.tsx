import {
  Basket,
  CaretRight,
  Clock,
  MapPin,
  Sparkle,
  Star,
  Storefront,
  Tag,
  ThumbsUp,
  TrendUp,
  WhatsappLogo,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import Link from 'next/link';
import { formatPhone, summarizeHours, waLink, type PromoBanner } from '@newagung/shared';
import { BannerCarousel } from '@/components/BannerCarousel';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProductRow } from '@/components/ProductCard';
import { getBanners, getBrands, getCategories, getProducts, getStore } from '@/lib/api';

/** Pengganti bila pemilik menghapus semua banner: tetap ada satu pembuka berfoto toko */
const FALLBACK_BANNER: PromoBanner = {
  id: 'toko',
  title: 'Alat tulis & kantor, lengkap di satu toko',
  subtitle: 'Pesan dari HP, barang disiapkan dulu, tinggal ambil di Jl. DR. Ratulangi No.52.',
  imageUrl: '/foto/lorong-kertas.webp',
  linkUrl: '/barang',
  theme: 'brand',
  sortOrder: 0,
  isActive: true,
  startsAt: null,
  endsAt: null,
};

function SectionHead({
  id,
  icon: SectionIcon,
  title,
  note,
  href,
  tone = 'brand',
}: {
  id: string;
  icon: Icon;
  title: string;
  note?: string;
  href: string;
  tone?: 'brand' | 'signal';
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone === 'signal' ? 'bg-signal text-white' : 'bg-brand-tint text-brand-text'}`}>
          <SectionIcon size={19} weight="fill" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-[18px] leading-tight font-bold tracking-[-0.015em] sm:text-[20px]">
            {title}
          </h2>
          {note && <p className="truncate text-[13px] text-muted">{note}</p>}
        </div>
      </div>
      <Link href={href} className="tap flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-brand-text hover:underline">
        Lihat semua
        <CaretRight size={14} weight="bold" aria-hidden />
      </Link>
    </div>
  );
}

const STEPS = [
  { icon: Basket, title: 'Pilih barang', body: 'Masukkan ke keranjang, per pcs, lusin, rim, atau box.' },
  { icon: WhatsappLogo, title: 'Kirim lewat WhatsApp', body: 'Daftar belanja terkirim rapi dengan kode pesanan.' },
  { icon: Storefront, title: 'Ambil atau diantar', body: 'Barang disiapkan dulu. Bayar di toko atau saat diantar.' },
];

export default async function HomePage() {
  const [store, categories, brands, banners, promo, terlaris, terbaru, pilihan] = await Promise.all([
    getStore(),
    getCategories(),
    getBrands(),
    getBanners(),
    getProducts({ promo: true, sort: 'diskon', pageSize: 12 }),
    getProducts({ sort: 'terlaris', pageSize: 12 }),
    getProducts({ sort: 'terbaru', pageSize: 12 }),
    getProducts({ featured: true, pageSize: 12 }),
  ]);
  const hours = summarizeHours(store.openingHours);
  // "Terlaris" hanya bila memang sudah ada pesanan yang diproses; tanpa angka, urutannya tidak berarti
  const laris = terlaris.items.filter((p) => p.sold > 0);
  const topBrands = brands
    .filter((b) => (b.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 12);

  const facts = [
    {
      icon: Clock,
      title: hours ? `Buka ${hours.split(',')[0]!.toLowerCase()}` : 'Jam buka',
      detail: hours ? `${hours.split(',')[1]?.trim()} WITA` : 'Lihat jadwal',
      href: '/tentang',
      external: false,
    },
    { icon: Star, title: '4,5 di Google', detail: '10.000+ ulasan', href: store.mapsUrl, external: true },
    { icon: MapPin, title: 'Jl. DR. Ratulangi No.52', detail: 'Mariso, Makassar', href: store.mapsUrl, external: true },
    { icon: WhatsappLogo, title: 'Tanya via WhatsApp', detail: formatPhone(store.whatsapp), href: waLink(store.whatsapp), external: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 md:pt-6">
      <h1 className="sr-only">Toko New Agung, alat tulis & kantor di Makassar</h1>

      <BannerCarousel banners={banners.length ? banners : [FALLBACK_BANNER]} />

      {/* Kategori: ikon bulat seperti marketplace */}
      <section aria-labelledby="kategori" className="card mt-4 p-3 sm:p-4 md:mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-4 px-1">
          <h2 id="kategori" className="text-[16px] font-bold">
            Kategori
          </h2>
          <Link href="/kategori" className="tap text-[14px] font-semibold text-brand-text hover:underline">
            Semua
          </Link>
        </div>
        <ul className="grid grid-cols-4 gap-y-1 sm:grid-cols-6 lg:grid-cols-[repeat(auto-fit,minmax(96px,1fr))]">
          <li>
            <Link href="/barang?promo=1" className="flex flex-col items-center gap-1.5 rounded-tag px-1 py-2 text-center hover:bg-sunken">
              <span className="grid size-12 place-items-center rounded-full bg-signal-tint text-signal-text sm:size-14">
                <Tag size={26} weight="duotone" aria-hidden />
              </span>
              <span className="line-clamp-2 text-[12px] leading-tight font-medium sm:text-[13px]">Lagi promo</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="flex flex-col items-center gap-1.5 rounded-tag px-1 py-2 text-center hover:bg-sunken">
                <span className="grid size-12 place-items-center rounded-full bg-brand-tint text-brand-text sm:size-14">
                  <CategoryIcon slug={c.slug} size={26} weight="duotone" aria-hidden />
                </span>
                <span className="line-clamp-2 text-[12px] leading-tight font-medium sm:text-[13px]">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {promo.items.length > 0 && (
        <section aria-labelledby="promo" className="mt-6 rounded-[var(--radius-media)] bg-signal-tint p-3 sm:p-5 md:mt-8">
          <SectionHead
            id="promo"
            icon={Tag}
            tone="signal"
            title="Lagi promo"
            note={`${promo.total} barang sedang turun harga`}
            href="/barang?promo=1&sort=diskon"
          />
          <ProductRow products={promo.items.slice(0, 6)} priorityCount={2} />
        </section>
      )}

      {laris.length > 0 && (
        <section aria-labelledby="terlaris" className="mt-8 md:mt-10">
          <SectionHead id="terlaris" icon={TrendUp} title="Paling sering dibeli" note="Dari pesanan 6 bulan terakhir" href="/barang?sort=terlaris" />
          <ProductRow products={laris.slice(0, 6)} />
        </section>
      )}

      {terbaru.items.length > 0 && (
        <section aria-labelledby="baru" className="mt-8 md:mt-10">
          <SectionHead id="baru" icon={Sparkle} title="Baru masuk rak" href="/barang?sort=terbaru" />
          <ProductRow products={terbaru.items.slice(0, 6)} />
        </section>
      )}

      {pilihan.items.length > 0 && (
        <section aria-labelledby="pilihan" className="mt-8 md:mt-10">
          <SectionHead id="pilihan" icon={ThumbsUp} title="Pilihan toko" note="Dipilih pemilik toko" href="/barang?featured=1" />
          <ProductRow products={pilihan.items.slice(0, 6)} />
        </section>
      )}

      {topBrands.length > 0 && (
        <section aria-labelledby="merek" className="mt-8 md:mt-10">
          <h2 id="merek" className="mb-3 text-[18px] font-bold tracking-[-0.015em] sm:text-[20px]">
            Merek di rak
          </h2>
          <ul className="flex flex-wrap gap-2">
            {topBrands.map((b) => (
              <li key={b.id}>
                <Link href={`/merek/${b.slug}`} className="tap chip border border-line bg-surface hover:border-brand-text hover:bg-surface hover:text-brand-text">
                  {b.name}
                  <span className="text-[12px] text-muted tabular-nums">{b.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Toko & cara pesan: ringkas, di bawah etalase */}
      <section aria-labelledby="cara" className="card mt-10 grid overflow-hidden md:mt-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="p-5 sm:p-6">
          <h2 id="cara" className="text-[18px] font-bold tracking-[-0.015em] sm:text-[20px]">
            Belanja dari HP, ambil di toko
          </h2>
          <p className="mt-1 text-[14px] text-muted">Tanpa akun dan tanpa bayar online. Harga akhir dikonfirmasi toko lewat WhatsApp.</p>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: StepIcon, title, body }, i) => (
              <li key={title} className="flex gap-3 sm:flex-col sm:gap-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <StepIcon size={20} weight="bold" aria-hidden />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold">
                    {i + 1}. {title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <ul className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:border-t-0 lg:border-l">
          {facts.map(({ icon: FactIcon, title, detail, href, external }) => (
            <li key={title} className="bg-sunken">
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})} className="group flex h-full items-center gap-3 p-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-brand-text ring-1 ring-line">
                  <FactIcon size={20} weight="bold" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold group-hover:underline">{title}</span>
                  <span className="block truncate text-[13px] text-muted">{detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
