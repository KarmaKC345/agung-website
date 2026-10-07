import { MagnifyingGlass } from '@phosphor-icons/react/ssr';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-tint text-brand-text">
        <MagnifyingGlass size={30} weight="bold" aria-hidden />
      </span>
      <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-[-0.02em]">Halaman ini tidak ada di rak.</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">Barangnya mungkin sudah tidak dijual atau link-nya salah ketik. Coba cari dari kotak di atas.</p>
      <Link href="/barang" className="btn btn-primary mt-8">
        Lihat katalog
      </Link>
    </div>
  );
}
