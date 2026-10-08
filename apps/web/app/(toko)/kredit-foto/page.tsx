import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getProducts } from '@/lib/api';
import kredit from '@/lib/kredit-foto.json';

export const metadata: Metadata = { title: 'Kredit foto', robots: { index: false } };

/** Kredit foto contoh (Wikimedia Commons) yang dipakai sebelum foto asli produk tersedia */
export default async function PhotoCreditsPage() {
  if (!kredit.length) notFound();
  const { items } = await getProducts({ pageSize: 60 });
  const nameOf = new Map(items.map((p) => [p.slug, p.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ label: 'Kredit foto' }]} />
      <h1 className="mt-4 text-[22px] font-bold tracking-[-0.015em] sm:text-[26px]">Kredit foto</h1>
      <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-muted">
        Sebagian foto produk di website ini adalah foto contoh dari Wikimedia Commons dengan lisensi bebas. Terima kasih kepada para fotografernya.
      </p>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="border-b border-line text-[13px] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Produk</th>
              <th className="px-4 py-3 font-semibold">Foto</th>
              <th className="px-4 py-3 font-semibold">Fotografer</th>
              <th className="px-4 py-3 font-semibold">Lisensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {kredit.map((k) => (
              <tr key={k.slug}>
                <td className="px-4 py-3">
                  <Link href={`/barang/${k.slug}`} className="font-medium hover:text-brand-text hover:underline">
                    {nameOf.get(k.slug) ?? k.slug}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <a href={k.halaman} target="_blank" rel="noopener" className="text-brand-text underline underline-offset-4">
                    {k.judul}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted">{k.pembuat}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{k.lisensi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
