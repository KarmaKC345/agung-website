'use client';

import { useEffect, useState } from 'react';
import { btnPrimary, btnSecondary, PageTitle, useMe } from '@/components/panel/PanelShell';
import { adminDownload, getToken } from '@/lib/admin';
import { adminFetch } from '@/lib/admin';
import { API_URL } from '@/lib/config';

interface Result {
  products: number;
  created: number;
  updated: number;
  prices: number;
  errors: { row: number; message: string }[];
}

export default function ImportPage() {
  const me = useMe();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [misses, setMisses] = useState<{ query: string; count: number }[]>([]);

  useEffect(() => {
    adminFetch<{ query: string; count: number }[]>('/search-misses').then(setMisses).catch(() => {});
  }, []);

  return (
    <>
      <PageTitle>Import / export</PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-tag border border-line bg-surface p-4">
          <h2 className="font-semibold">Import dari Excel / CSV</h2>
          <p className="mt-1 text-[14px] text-muted">
            Satu baris = satu harga. Kolom: <code className="text-[13px]">kategori, merek, nama, varian, warna, sku, satuan, isi, harga, stok, deskripsi</code>.
            Barang dengan nama sama digabung; varian yang tidak ada di file tidak dihapus.
          </p>
          <button className={`${btnSecondary} mt-3`} onClick={() => adminDownload('/import/template', 'template-barang-new-agung.csv')}>
            Unduh template
          </button>
          {me.role === 'owner' ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!file) return;
                setBusy(true);
                setError(null);
                setResult(null);
                try {
                  const form = new FormData();
                  form.append('file', file);
                  const token = await getToken();
                  const res = await fetch(`${API_URL}/api/admin/import`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? 'Import gagal');
                  setResult(data);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Import gagal');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-[14px]" />
              <button disabled={!file || busy} className={btnPrimary}>{busy ? 'Mengimpor…' : 'Import'}</button>
            </form>
          ) : (
            <p className="mt-4 text-[14px] text-muted">Import hanya bisa dilakukan pemilik.</p>
          )}
          {error && <p className="mt-3 text-danger">{error}</p>}
          {result && (
            <div role="status" className="mt-4 rounded-tag bg-sunken p-3 text-[14px]">
              <p className="font-semibold">
                {result.products} barang diproses: {result.created} baru, {result.updated} diperbarui, {result.prices} harga.
              </p>
              {result.errors.length > 0 && (
                <>
                  <p className="mt-2 font-semibold text-danger">{result.errors.length} baris dilewati:</p>
                  <ul className="mt-1 max-h-48 overflow-auto">
                    {result.errors.map((e) => (
                      <li key={e.row}>Baris {e.row}: {e.message}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-tag border border-line bg-surface p-4">
            <h2 className="font-semibold">Export / cadangan</h2>
            <p className="mt-1 text-[14px] text-muted">Semua barang dan harga dalam format yang sama dengan import. Bisa dibuka di Excel.</p>
            <button className={`${btnSecondary} mt-3`} onClick={() => adminDownload('/export', `barang-new-agung-${new Date().toISOString().slice(0, 10)}.csv`)}>
              Unduh semua barang (CSV)
            </button>
          </div>
          <div className="rounded-tag border border-line bg-surface p-4">
            <h2 className="font-semibold">Dicari pelanggan, tapi belum ada</h2>
            <p className="mt-1 text-[14px] text-muted">Kata kunci 30 hari terakhir yang tidak menemukan barang. Bahan untuk menambah barang ke website.</p>
            {misses.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">Belum ada.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {misses.map((m) => (
                  <li key={m.query} className="rounded-full bg-sunken px-3 py-1 text-[14px]">
                    {m.query} <span className="text-muted tabular-nums">×{m.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
