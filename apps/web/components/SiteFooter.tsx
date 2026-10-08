import { Clock, MapPin, Phone, WhatsappLogo } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { DAY_LABEL, DAY_ORDER, formatPhone, formatTime, summarizeHours, waLink, type StoreInfo } from '@newagung/shared';
import { LogoMark } from './Logo';
import { MapEmbed } from './MapEmbed';

export function SiteFooter({ store }: { store: StoreInfo }) {
  const summary = summarizeHours(store.openingHours);
  return (
    <footer className="mt-20 border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-[15px] lg:grid-cols-[1fr_1.15fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <p className="text-[17px] font-bold tracking-[-0.01em]">{store.name}</p>
          </div>

          <ul className="mt-8 space-y-5">
            <li className="flex gap-3.5">
              <MapPin size={22} className="mt-0.5 shrink-0 text-brand-text" aria-hidden />
              <div>
                <p className="font-semibold">Alamat</p>
                <p className="mt-0.5 max-w-sm leading-relaxed text-muted">{store.address}</p>
                <a href={store.mapsUrl} target="_blank" rel="noopener" className="tap mt-1.5 inline-block font-semibold text-brand-text hover:underline">
                  Petunjuk arah
                </a>
              </div>
            </li>
            <li className="flex gap-3.5">
              <Clock size={22} className="mt-0.5 shrink-0 text-brand-text" aria-hidden />
              <div>
                <p className="font-semibold">Jam buka</p>
                {summary ? (
                  <p className="mt-0.5 text-muted">{summary} WITA</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-muted">
                    {DAY_ORDER.map((d) => {
                      const h = store.openingHours[d];
                      return (
                        <li key={d} className="flex justify-between gap-6">
                          <span>{DAY_LABEL[d]}</span>
                          <span className="tabular-nums">{h ? `${formatTime(h.open)}-${formatTime(h.close)}` : 'Tutup'}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
            <li className="flex gap-3.5">
              <WhatsappLogo size={22} className="mt-0.5 shrink-0 text-wa-text" aria-hidden />
              <div>
                <p className="font-semibold">WhatsApp</p>
                <a href={waLink(store.whatsapp)} target="_blank" rel="noopener" className="tap mt-0.5 inline-block text-muted hover:text-ink hover:underline">
                  {formatPhone(store.whatsapp)}
                </a>
              </div>
            </li>
            <li className="flex gap-3.5">
              <Phone size={22} className="mt-0.5 shrink-0 text-brand-text" aria-hidden />
              <div>
                <p className="font-semibold">Telepon</p>
                <a href={`tel:${store.phone}`} className="tap mt-0.5 inline-block text-muted hover:text-ink hover:underline">
                  {formatPhone(store.phone)}
                </a>
              </div>
            </li>
          </ul>
        </div>
        <MapEmbed store={store} className="aspect-[4/3] w-full rounded-[var(--radius-media)] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[320px]" />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-[13px] text-muted">
          <span>© {new Date().getFullYear()} {store.name}. Harga akhir dikonfirmasi oleh toko saat pemesanan.</span>
          <Link href="/panel" className="tap hover:text-ink">
            Panel toko
          </Link>
        </div>
      </div>
    </footer>
  );
}
