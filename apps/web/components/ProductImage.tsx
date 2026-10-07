import Image from 'next/image';

/**
 * Foto barang, atau pengganti yang rapi bila foto belum ada: nama merek dan jenis barang
 * ditulis seperti label di dus — bukan ilustrasi stok.
 */
export function ProductImage({
  src,
  name,
  brand,
  sizes,
  priority,
  className = '',
}: {
  src: string | null;
  name: string;
  brand: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative aspect-square overflow-hidden bg-white ${className}`}>
        <Image src={src} alt={name} fill sizes={sizes} priority={priority} className="object-contain p-2" />
      </div>
    );
  }
  const escaped = brand?.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
  const brandPrefix = escaped ? new RegExp('^' + escaped + '\\s+', 'i') : null;
  const words = (brandPrefix ? name.replace(brandPrefix, '') : name).split(/\s+/);
  const kind = words.slice(0, 2).join(' ');
  return (
    <div
      className={`relative flex aspect-square flex-col justify-between overflow-hidden bg-sunken p-3 ${className}`}
      role="img"
      aria-label={`${name} (foto belum tersedia)`}
    >
      <span className="signage text-[11px] text-muted">{brand ?? 'New Agung'}</span>
      <span className="condensed line-clamp-3 text-[22px] leading-[1.05] font-[750] break-words text-ink/25 sm:text-[26px]">
        {kind}
      </span>
    </div>
  );
}
