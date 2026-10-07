import { formatRupiah } from '@newagung/shared';

/** Harga gaya label rak: "Rp" kecil, angka sempit tebal */
export function Price({ value, className = '' }: { value: number; className?: string }) {
  const digits = formatRupiah(value).replace(/^Rp/, '');
  return (
    <span className={`price ${className}`}>
      <span className="price-rp">Rp</span>
      {digits}
    </span>
  );
}
