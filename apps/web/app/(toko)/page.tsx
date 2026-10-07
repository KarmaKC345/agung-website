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

/** Cara belanja dari HP — urutan nyata, jadi memakai nomor */
const STEPS = [
  { title: 'Cari barang atau pilih lorong', body: 'Lihat harga, warna, dan satuan: pcs, lusin, rim, atau box.' },
  { title: 'Masukkan keranjang', body: 'Campur sebanyak yang perlu, dari pulpen sampai kertas per box.' },
  { title: 'Kirim lewat WhatsApp', body: 'Daftar belanja terkirim rapi ke toko, lengkap dengan kode pesanan.' },
  { title: 'Ambil di toko atau minta diantar', body: 'Barang disiapkan dulu, jadi tidak perlu mencari di rak. Ongkir dibicarakan di WhatsApp.' },
];

export default async function HomePage() {
  const [store, categories, brands, latest] = await Promise.all([
    getStore(),
    getCategories(),
    getBrands(),
    getProducts({ sort: 'terbaru', pageSize: 5 }),
  ]);
  const hours = summarizeHours(store.openingHours);
  const topBrands = brands
    .filter((b) => (b.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 10);

  return (
    <>
      {/* Pembuka: tentang toko, dengan foto lorong asli */}
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
            <h1 className="condensed mt-3 text-[36px] leading-[0.98] font-[800] tracking-[-0.015em] sm:text-[48px]">
              Toko alat tulis & kantor
              <br />
              <span className="text-brand-text">di Jl. Ratulangi, Makassar.</span>
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">
              Swalayan ATK yang buka {hours ? hours.toLowerCase() : 'setiap hari'}. Belanja langsung di toko, atau pilih barang dari HP lalu
              pesan lewat WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/barang" className="inline-flex h-12 items-center rounded-tag bg-accent px-5 text-[16px] font-semibold text-accent-ink hover:brightness-110">
                Lihat katalog
              </Link>
              <a
                href={store.mapsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex h-12 items-center rounded-tag border border-line-strong bg-surface px-5 text-[16px] font-semibold hover:border-ink"
              >
                Rute ke toko
              </a>
            </div>
            <p className="mt-4 text-[14px] text-muted">
              <a href={store.mapsUrl} target="_blank" rel="noopener" className="tap underline underline-offset-4">
                4,5 dari 10.000+ ulasan di Google
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Tentang toko */}
        <section className="mt-12 grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-10" aria-labelledby="dalam-toko">
          <div className="order-2 grid grid-cols-2 gap-3 self-start md:order-1">
            <div className="relative col-span-2 aspect-[5/2] overflow-hidden rounded-tag">
              <Image
                src={papan}
                alt="Papan gantung lorong Spidol/Stabilo dan Cat Poster/Lem di Toko New Agung"
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 600px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-tag sm:col-span-1 sm:aspect-[4/3]">
              <Image
                src={kalkulator}
                alt="Etalase kalkulator Casio dan lorong tinta"
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 300px, 100vw"
                className="object-cover"
              />
            </div>
            <p className="col-span-2 text-[14px] leading-relaxed text-muted sm:col-span-1 sm:self-end">
              Setiap lorong punya papan gantung sesuai jenis barangnya. Website ini memakai pembagian yang sama.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <h2 id="dalam-toko" className="text-[24px] font-bold">
              Di dalam toko
            </h2>
            <p className="mt-3 max-w-prose text-[16px] leading-relaxed">
              New Agung adalah swalayan alat tulis dan perlengkapan kantor. Ambil keranjang, lalu telusuri lorongnya: pulpen dan pensil, kertas,
              buku dan album, map seminar, stempel, cat poster, sampai kalkulator dan tinta printer. Pulpen dan barang kecil lainnya dilayani di
              etalase kaca.
            </p>

            <dl className="mt-6 divide-y divide-line border-y border-line text-[15px]">
              {hours && (
                <div className="flex gap-4 py-2.5">
                  <dt className="signage w-24 shrink-0 pt-0.5 text-[12px] text-muted">Jam buka</dt>
                  <dd>{hours} WITA</dd>
                </div>
              )}
              <div className="flex gap-4 py-2.5">
                <dt className="signage w-24 shrink-0 pt-0.5 text-[12px] text-muted">Alamat</dt>
                <dd>{store.address}</dd>
              </div>
              <div className="flex gap-4 py-2.5">
                <dt className="signage w-24 shrink-0 pt-0.5 text-[12px] text-muted">WhatsApp</dt>
                <dd>
                  <a href={waLink(store.whatsapp)} target="_blank" rel="noopener" className="tap font-semibold text-wa-text underline underline-offset-4">
                    {formatPhone(store.whatsapp)}
                  </a>
                </dd>
              </div>
              <div className="flex gap-4 py-2.5">
                <dt className="signage w-24 shrink-0 pt-0.5 text-[12px] text-muted">Telepon</dt>
                <dd>
                  <a href={`tel:${store.phone}`} className="tap underline underline-offset-4">
                    {formatPhone(store.phone)}
                  </a>
                </dd>
              </div>
            </dl>

            {topBrands.length > 0 && (
              <div className="mt-6">
                <p className="signage text-[12px] text-muted">Merek di rak</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                  {topBrands.map((b) => (
                    <li key={b.id}>
                      <Link href={`/merek/${b.slug}`} className="tap font-medium hover:underline">
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href="/tentang" className="tap mt-6 inline-block text-[15px] font-semibold text-brand-text hover:underline">
              Peta & jam buka lengkap
            </Link>
          </div>
        </section>

        {/* Cara belanja dari HP, bergaya nota */}
        <section className="mt-14 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-10" aria-labelledby="belanja">
          <div>
            <h2 id="belanja" className="text-[24px] font-bold">
              Belanja dari HP
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-muted">
              Tidak perlu daftar akun dan tidak ada pembayaran online. Pilih barangnya di sini; harga akhir dan cara bayar dikonfirmasi langsung
              oleh toko lewat WhatsApp.
            </p>
            <Link href="/kategori" className="mt-5 inline-flex h-11 items-center rounded-tag bg-ink px-4 text-[15px] font-semibold text-surface">
              Mulai dari lorong
            </Link>
          </div>
          <ol className="rounded-tag border border-line bg-surface px-5 py-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 border-b-[1.5px] border-dashed border-line-strong py-4 last:border-0">
                <span className="font-mono text-[15px] font-medium text-brand-text tabular-nums">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-muted">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Cuplikan katalog: ringkas */}
        <section className="mt-14" aria-labelledby="lorong">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="lorong" className="text-[18px] font-bold">
              Lorong paling ramai
            </h2>
            <Link href="/kategori" className="tap text-[14px] font-semibold text-brand-text hover:underline">
              Semua kategori
            </Link>
          </div>
          <AisleSigns categories={categories} compact />
        </section>

        <section className="mt-10" aria-labelledby="baru">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="baru" className="text-[18px] font-bold">
              Baru masuk rak
            </h2>
            <Link href="/barang" className="tap text-[14px] font-semibold text-brand-text hover:underline">
              Lihat semua barang
            </Link>
          </div>
          <ProductRow products={latest.items} />
        </section>
      </div>
    </>
  );
}
