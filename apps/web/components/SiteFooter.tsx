import Link from 'next/link';
import { MapEmbed } from './MapEmbed';
import { DAY_LABEL, DAY_ORDER, formatPhone, formatTime, summarizeHours, waLink, type StoreInfo } from '@newagung/shared';

export function SiteFooter({ store }: { store: StoreInfo }) {
  const summary = summarizeHours(store.openingHours);
  return (
    <footer className="mt-16 border-t border-line bg-surface pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-[15px] lg:grid-cols-[1fr_1.15fr]">
        <div className="grid content-start gap-8 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="signage text-[13px] text-muted">Alamat</p>
          <p className="mt-2 max-w-sm leading-relaxed">{store.address}</p>
          <a href={store.mapsUrl} target="_blank" rel="noopener" className="tap mt-2 inline-block font-semibold text-brand-text underline underline-offset-4">
            Buka rute di Google Maps
          </a>
        </div>
        <div>
          <p className="signage text-[13px] text-muted">Jam buka</p>
          {summary ? (
            <p className="mt-2">{summary} WITA</p>
          ) : (
            <ul className="mt-2 space-y-0.5">
              {DAY_ORDER.map((d) => {
                const h = store.openingHours[d];
                return (
                  <li key={d} className="flex justify-between gap-4">
                    <span>{DAY_LABEL[d]}</span>
                    <span className="tabular-nums">{h ? `${formatTime(h.open)}–${formatTime(h.close)}` : 'Tutup'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div>
          <p className="signage text-[13px] text-muted">Hubungi</p>
          <ul className="mt-2 space-y-1">
            <li>
              WhatsApp{' '}
              <a href={waLink(store.whatsapp)} className="font-semibold underline underline-offset-4" target="_blank" rel="noopener">
                {formatPhone(store.whatsapp)}
              </a>
            </li>
            <li>
              Telepon{' '}
              <a href={`tel:${store.phone}`} className="font-semibold underline underline-offset-4">
                {formatPhone(store.phone)}
              </a>
            </li>
          </ul>
        </div>
        </div>
        <MapEmbed store={store} className="aspect-[16/10] w-full lg:aspect-auto lg:min-h-[260px]" />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[13px] text-muted">
          <span>{store.name}, Makassar</span>
          <span>
            Harga di website adalah perkiraan, dikonfirmasi toko saat memesan. <Link href="/panel" className="tap ml-2 hover:text-ink">Panel toko</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
