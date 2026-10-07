import type { StoreInfo } from '@newagung/shared';

/** Peta Google Maps lokasi toko (dimuat saat discroll) */
export function MapEmbed({ store, className = '' }: { store: StoreInfo; className?: string }) {
  const query = store.lat && store.lng ? `${store.lat},${store.lng}` : `${store.name}, ${store.address}`;
  return (
    <div className={`relative overflow-hidden rounded-tag border border-line bg-sunken ${className}`}>
      <iframe
        title={`Peta lokasi ${store.name}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}
