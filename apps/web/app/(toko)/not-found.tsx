import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="signage text-[13px] text-muted">404</p>
      <h1 className="mt-2 text-[26px] font-bold">Halaman ini tidak ada di rak.</h1>
      <p className="mt-2 text-muted">Barangnya mungkin sudah tidak dijual atau link-nya salah ketik. Coba cari dari kotak di atas.</p>
      <Link href="/kategori" className="mt-6 inline-flex h-11 items-center rounded-tag bg-ink px-4 font-semibold text-surface">
        Lihat semua lorong
      </Link>
    </div>
  );
}
