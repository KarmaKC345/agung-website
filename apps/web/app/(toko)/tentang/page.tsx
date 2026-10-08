import type { Metadata } from 'next';
import Image from 'next/image';
import { DAY_LABEL, DAY_ORDER, formatPhone, formatTime, waLink } from '@newagung/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusPill } from '@/components/StatusPill';
import { getStore } from '@/lib/api';
import kalkulator from '@/public/foto/etalase-kalkulator.webp';
import papan from '@/public/foto/papan-lorong.webp';

export const metadata: Metadata = {
  title: 'Alamat & jam buka',
  description: 'Toko New Agung, Jl. DR. Ratulangi No.52, Mariso, Makassar. Buka setiap hari 05.00-22.00 WITA.',
};

export default async function AboutPage() {
  const store = await getStore();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-5">
      <Breadcrumbs items={[{ label: 'Alamat & jam buka' }]} />
      <h1 className="mt-4 text-[28px] leading-tight font-bold sm:text-[34px]">{store.name}</h1>
      <StatusPill hours={store.openingHours} timezone={store.timezone} className="mt-2 text-muted" />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <section aria-labelledby="alamat">
            <h2 id="alamat" className="text-[18px] font-bold tracking-[-0.01em]">
              Alamat
            </h2>
            <p className="mt-2 text-[17px] leading-relaxed">{store.address}</p>
            <a href={store.mapsUrl} target="_blank" rel="noopener" className="mt-3 inline-flex h-11 items-center rounded-tag bg-ink px-4 font-semibold text-surface">
              Rute di Google Maps
            </a>
          </section>

          <section aria-labelledby="jam">
            <h2 id="jam" className="text-[18px] font-bold tracking-[-0.01em]">
              Jam buka (WITA)
            </h2>
            <table className="mt-2 w-full max-w-sm text-[15px]">
              <tbody>
                {DAY_ORDER.map((d) => {
                  const h = store.openingHours[d];
                  return (
                    <tr key={d} className="border-b border-line">
                      <th scope="row" className="py-2 text-left font-normal">
                        {DAY_LABEL[d]}
                      </th>
                      <td className="py-2 text-right tabular-nums">{h ? `${formatTime(h.open)}-${formatTime(h.close)}` : 'Tutup'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="kontak">
            <h2 id="kontak" className="text-[18px] font-bold tracking-[-0.01em]">
              Kontak
            </h2>
            <ul className="mt-2 space-y-2 text-[16px]">
              <li>
                WhatsApp pesanan:{' '}
                <a href={waLink(store.whatsapp)} target="_blank" rel="noopener" className="font-semibold text-wa-text underline underline-offset-4">
                  {formatPhone(store.whatsapp)}
                </a>
              </li>
              <li>
                Telepon:{' '}
                <a href={`tel:${store.phone}`} className="font-semibold underline underline-offset-4">
                  {formatPhone(store.phone)}
                </a>
              </li>
              <li>
                Google:{' '}
                <a href={store.mapsUrl} target="_blank" rel="noopener" className="underline underline-offset-4">
                  4,5 dari 10.000+ ulasan
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-tag">
              <Image src={kalkulator} alt="Etalase kalkulator Casio dan lorong tinta" fill placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="relative aspect-[5/2] overflow-hidden rounded-tag">
              <Image src={papan} alt="Papan gantung lorong di dalam toko" fill placeholder="blur" sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
