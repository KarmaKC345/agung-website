import { Basket, Clock, MagnifyingGlass, MapPin, Star, Storefront, WhatsappLogo } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { formatPhone, summarizeHours, waLink } from '@newagung/shared';
import { AisleSigns } from '@/components/AisleSigns';
import { ProductRow } from '@/components/ProductCard';
import { StatusPill } from '@/components/StatusPill';
import { getBrands, getCategories, getProducts, getStore } from '@/lib/api';
import kalkulator from '@/public/foto/etalase-kalkulator.webp';
import lorong from '@/public/foto/lorong-kertas.webp';
import papan from '@/public/foto/papan-lorong.webp';

/** Cara belanja dari HP: urutan nyata dari website sampai barang diterima */
const STEPS = [
  { icon: MagnifyingGlass, title: 'Cari barang', body: 'Lihat harga, warna, dan satuan: pcs, lusin, rim, atau box.' },
  { icon: Basket, title: 'Masukkan keranjang', body: 'Campur sebanyak yang perlu, dari pulpen sampai kertas per box.' },
  { icon: WhatsappLogo, title: 'Kirim lewat WhatsApp', body: 'Daftar belanja terkirim rapi ke toko, lengkap dengan kode pesanan.' },
  { icon: Storefront, title: 'Ambil atau diantar', body: 'Barang disiapkan dulu. Ongkir antar dibicarakan di WhatsApp.' },
];

export default async function HomePage() {
  const [store, categories, brands, latest] = await Promise.all([
    getStore(),
    getCategories(),
    getBrands(),
    getProducts({ sort: 'terbaru', pageSize: 5 }),
  ]);
  const hours = summarizeHours(store.openingHours);
  const addr = store.address.split(',').map((s) => s.trim());
  const topBrands = brands
    .filter((b) => (b.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 10);

  const facts = [
    {
      icon: Clock,
      title: hours ? hours.split(',')[0]! : 'Jam buka',
      detail: hours ? `${hours.split(',')[1]?.trim()} WITA` : 'Lihat jadwal lengkap',
      href: '/tentang',
      external: false,
    },
    { icon: Star, title: '4,5 di Google', detail: '10.000+ ulasan', href: store.mapsUrl, external: true },
    { icon: MapPin, title: addr[0] ?? store.address, detail: addr.slice(2, 4).join(', ') || 'Makassar', href: store.mapsUrl, external: true },
    { icon: WhatsappLogo, title: 'Pesan lewat WhatsApp', detail: formatPhone(store.whatsapp), href: waLink(store.whatsapp), external: true },
  ];

  return (
    <>
      {/* 1. Pembuka: apa & di mana, dengan foto lorong asli */}
      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-6 pb-10 md:grid-cols-[1.15fr_1fr] md:gap-12 md:pt-12 md:pb-14">
        <div className="md:order-2">
          <div className="rise relative aspect-[4/3] overflow-hidden rounded-[var(--radius-media)] md:aspect-[5/6] lg:aspect-[4/4.3]" style={{ ['--i' as string]: 2 }}>
            <Image
              src={lorong}
              alt="Lorong kertas warna dan map di dalam Toko New Agung"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 540px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="md:order-1">
          <div className="rise" style={{ ['--i' as string]: 0 }}>
            <StatusPill hours={store.openingHours} timezone={store.timezone} className="rounded-full bg-surface px-3 py-1.5 text-muted ring-1 ring-line" />
          </div>
          <h1
            className="rise mt-5 text-[36px] leading-[1.06] font-extrabold tracking-[-0.035em] sm:text-[44px] lg:text-[50px]"
            style={{ ['--i' as string]: 1 }}
          >
            <span className="block text-balance">Toko alat tulis & kantor</span>
            <span className="block text-brand-text">di Makassar.</span>
          </h1>
          <p className="rise mt-5 max-w-[44ch] text-[17px] leading-relaxed text-muted" style={{ ['--i' as string]: 2 }}>
            Swalayan ATK di Jl. DR. Ratulangi No.52, buka{' '}
            {hours ? (
              <>
                {hours.split(',')[0]!.toLowerCase()} <span className="whitespace-nowrap">{hours.split(',')[1]?.trim()}</span>
              </>
            ) : (
              'setiap hari'
            )}
            . Belanja di toko atau pesan dari HP.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ['--i' as string]: 3 }}>
            <Link href="/barang" className="btn btn-primary btn-lg">
              Lihat katalog
            </Link>
            <a href={store.mapsUrl} target="_blank" rel="noopener" className="btn btn-secondary btn-lg">
              <MapPin size={20} weight="bold" aria-hidden />
              Rute ke toko
            </a>
          </div>
        </div>
      </section>

      {/* 2. Fakta toko */}
      <section aria-label="Info singkat toko" className="border-y border-line bg-surface">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {facts.map(({ icon: Icon, title, detail, href, external }) => (
            <li key={title}>
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                className="group flex items-center gap-3.5 py-4 sm:py-5 lg:px-6 lg:first:pl-0"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-text">
                  <Icon size={22} weight="bold" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold group-hover:underline">{title}</span>
                  <span className="block truncate text-[14px] text-muted">{detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* 3. Di dalam toko: bento 4 sel */}
        <section aria-labelledby="dalam-toko" className="reveal mt-16 grid gap-3 md:mt-20 lg:grid-cols-3 lg:gap-4">
          <div className="card flex flex-col justify-between gap-6 rounded-[var(--radius-media)] p-6 lg:p-8">
            <div>
              <h2 id="dalam-toko" className="text-[28px] leading-tight font-bold tracking-[-0.025em]">
                Di dalam toko
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-muted">
                Ambil keranjang, lalu telusuri lorong sesuai papan gantungnya. Pulpen dan barang kecil lain dilayani di etalase kaca.
              </p>
            </div>
            <Link href="/tentang" className="btn btn-secondary self-start">
              Tentang toko
            </Link>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-media)] lg:col-span-2 lg:aspect-[2/1]">
            <Image
              src={papan}
              alt="Papan gantung lorong Spidol/Stabilo dan Cat Poster/Lem di Toko New Agung"
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-media)] lg:col-span-2 lg:aspect-[2/1]">
            <Image
              src={kalkulator}
              alt="Etalase kalkulator Casio dan lorong tinta"
              fill
              placeholder="blur"
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col rounded-[var(--radius-media)] bg-brand-tint p-6 lg:p-8">
            <h3 className="text-[16px] font-bold">Merek di rak</h3>
            {topBrands.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {topBrands.map((b) => (
                  <li key={b.id}>
                    <Link href={`/merek/${b.slug}`} className="tap chip bg-surface hover:bg-surface hover:text-brand-text">
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[14px] text-muted">Daftar merek muncul setelah barang dimasukkan.</p>
            )}
          </div>
        </section>

        {/* 4. Belanja dari HP: alur bertahap */}
        <section aria-labelledby="belanja" className="reveal mt-16 md:mt-20">
          <h2 id="belanja" className="text-[28px] leading-tight font-bold tracking-[-0.025em]">
            Belanja dari HP
          </h2>
          <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-muted">
            Tanpa akun dan tanpa bayar online. Harga akhir dan cara bayar dikonfirmasi toko lewat WhatsApp.
          </p>
          <ol className="mt-8 grid gap-0 lg:grid-cols-4 lg:gap-6">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-12 bottom-0 left-6 w-px bg-line-strong lg:top-6 lg:right-0 lg:bottom-auto lg:left-14 lg:h-px lg:w-auto"
                  />
                )}
                <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Icon size={22} weight="bold" aria-hidden />
                </span>
                <span className="pt-1 lg:pt-0">
                  <span className="block text-[16px] font-semibold">{title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. Lorong */}
        <section aria-labelledby="lorong" className="reveal mt-16 md:mt-20">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="lorong" className="text-[22px] font-bold tracking-[-0.02em]">
              Pilih lorong
            </h2>
            <Link href="/kategori" className="tap text-[15px] font-semibold text-brand-text hover:underline">
              Semua kategori
            </Link>
          </div>
          <AisleSigns categories={categories} compact />
        </section>

        {/* 6. Barang baru */}
        <section aria-labelledby="baru" className="reveal mt-14">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="baru" className="text-[22px] font-bold tracking-[-0.02em]">
              Baru masuk rak
            </h2>
            <Link href="/barang" className="tap text-[15px] font-semibold text-brand-text hover:underline">
              Lihat katalog
            </Link>
          </div>
          <ProductRow products={latest.items} />
        </section>
      </div>
    </>
  );
}
