import Image from 'next/image';
import { CategoryIcon } from './CategoryIcon';

/**
 * Foto barang, atau pengganti yang tenang bila foto belum ada: ikon jenis barang di atas
 * bidang lembut, tanpa ilustrasi stok atau teks besar.
 */
export function ProductImage({
  src,
  name,
  categorySlug,
  sizes,
  priority,
  className = '',
}: {
  src: string | null;
  name: string;
  categorySlug?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative aspect-square overflow-hidden bg-white ${className}`}>
        <Image src={src} alt={name} fill sizes={sizes} priority={priority} className="object-contain" />
      </div>
    );
  }
  return (
    <div className={`grid aspect-square place-items-center bg-sunken ${className}`} role="img" aria-label={`${name} (foto belum tersedia)`}>
      <CategoryIcon slug={categorySlug} size="34%" weight="thin" className="text-muted opacity-60" aria-hidden />
    </div>
  );
}
