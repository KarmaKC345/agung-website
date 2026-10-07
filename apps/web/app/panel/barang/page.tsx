'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatRupiah, type Category } from '@newagung/shared';
import { btnPrimary, btnSecondary, inputCls, PageTitle } from '@/components/panel/PanelShell';
import { adminFetch } from '@/lib/admin';

interface Row {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  category: string | null;
  brand: string | null;
  variantCount: number;
  minPrice: number | null;
  image: string | null;
}

export default function ProductsAdminPage() {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('semua');
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState<Category[]>([]);
  const [data, setData] = useState<{ items: Row[]; total: number } | null>(null);

  useEffect(() => {
    adminFetch<Category[]>('/categories').then(setCats).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams({ page: String(page), status });
      if (q.trim()) sp.set('q', q.trim());
      if (categoryId) sp.set('categoryId', categoryId);
      adminFetch<{ items: Row[]; total: number }>(`/products?${sp}`).then(setData).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q, categoryId, status, page]);

  return (
    <>
      <PageTitle actions={<Link href="/panel/barang/baru" className={btnPrimary}>+ Tambah barang</Link>}>Barang</PageTitle>
      <div className="flex flex-wrap gap-2">
        <input type="search" placeholder="Cari nama, merek, SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={`${inputCls} max-w-xs`} />
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className={`${inputCls} w-auto`}>
          <option value="">Semua kategori</option>
          {cats.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={c.id}>{c.name} (semua)</option>
              {c.children?.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} w-auto`}>
          <option value="semua">Aktif & nonaktif</option>
          <option value="aktif">Tampil di website</option>
          <option value="nonaktif">Disembunyikan</option>
        </select>
      </div>

      {!data ? (
        <p className="mt-6 text-muted">Memuat…</p>
      ) : (
        <>
          <p className="mt-4 text-[13px] text-muted tabular-nums">{data.total} barang</p>
          <ul className="mt-2 divide-y divide-line border-y border-line bg-surface">
            {data.items.map((p) => (
              <li key={p.id}>
                <Link href={`/panel/barang/${p.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-sunken">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-tag bg-sunken">
                    {p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.name} {!p.isActive && <span className="ml-1 rounded-tag bg-sunken px-1.5 text-[11px] text-muted">disembunyikan</span>}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {[p.category, p.brand, `${p.variantCount} varian`].filter(Boolean).join(' · ')}
                      {!p.image && ' · belum ada foto'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[14px] tabular-nums">{p.minPrice !== null ? formatRupiah(p.minPrice) : '–'}</span>
                </Link>
              </li>
            ))}
          </ul>
          {data.total > 30 && (
            <div className="mt-4 flex gap-2">
              <button className={btnSecondary} disabled={page === 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button>
              <button className={btnSecondary} disabled={page * 30 >= data.total} onClick={() => setPage(page + 1)}>Berikutnya →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
