import { connection } from 'next/server';
import { BottomNav } from '@/components/BottomNav';
import { RealtimeListener } from '@/components/RealtimeListener';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getCategories, getStore } from '@/lib/api';
import { SITE_URL } from '@/lib/config';
import { DAY_ORDER, type StoreInfo } from '@newagung/shared';

const SCHEMA_DAY: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

function storeJsonLd(store: StoreInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    url: SITE_URL,
    image: `${SITE_URL}/foto/lorong-kertas.webp`,
    telephone: `+62${store.phone.replace(/^0/, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. DR. Ratulangi No.52, Kunjung Mae, Mariso',
      addressLocality: 'Makassar',
      addressRegion: 'Sulawesi Selatan',
      postalCode: '90114',
      addressCountry: 'ID',
    },
    ...(store.lat && store.lng ? { geo: { '@type': 'GeoCoordinates', latitude: store.lat, longitude: store.lng } } : {}),
    hasMap: store.mapsUrl,
    openingHoursSpecification: DAY_ORDER.flatMap((d) => {
      const h = store.openingHours[d];
      return h ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAY[d], opens: h.open, closes: h.close }] : [];
    }),
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Halaman toko dirender saat dikunjungi, bukan saat build, sehingga image Docker bisa
  // dibangun tanpa API. Data API tetap di-cache (fetch + tag) dan dibersihkan lewat
  // /api/revalidate setiap kali barang/harga berubah.
  await connection();
  const [store, categories] = await Promise.all([getStore(), getCategories()]);
  return (
    <>
      <a href="#isi" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:p-2">
        Langsung ke konten utama
      </a>
      <SiteHeader store={store} categories={categories} />
      <main id="isi">
        {children}
      </main>
      <RealtimeListener />
      <SiteFooter store={store} />
      <BottomNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd(store)).replace(/</g, '\\u003c') }}
      />
    </>
  );
}
