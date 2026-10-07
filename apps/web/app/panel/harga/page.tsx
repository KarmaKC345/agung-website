'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatRupiah, type Brand, type Category } from '@newagung/shared';
import { btnPrimary, btnSecondary, inputCls, PageTitle, useMe } from '@/components/panel/PanelShell';
import { useDialog } from '@/components/panel/Dialog';
import { adminFetch } from '@/lib/admin';

interface PriceRow {
  variantPriceId: string;
  productName: string;
  variantLabel: string;
  unit: string;
  qtyPerUnit: number;
  price: number;
  brand: string | null;
}
type RowState = 'idle' | 'saving' | 'saved' | 'error';
const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function PriceInput({ row, onSaved }: { row: PriceRow; onSaved: (p: number) => void }) {
  const [value, setValue] = useState(String(row.price));
  const [state, setState] = useState<RowState>('idle');
  const [history, setHistory] = useState<{ oldPrice: number; newPrice: number; changedAt: string; changedBy: string | null }[] | null>(null);

  useEffect(() => setValue(String(row.price)), [row.price]);

  async function save() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return setState('error');
    if (n === row.price) return;
    setState('saving');
    try {
      await adminFetch(`/prices/${row.variantPriceId}`, { method: 'PATCH', json: { price: n } });
      onSaved(n);
      setState('saved');
      setHistory(null);
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setState('idle');
          }}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
          className={`${inputCls} w-32 text-right tabular-nums ${state === 'error' ? 'border-danger' : ''}`}
          aria-label={`Harga ${row.productName} ${row.variantLabel} per ${row.unit}`}
        />
        <span className="w-14 text-[12px]">
          {state === 'saving' && <span className="text-muted">simpan…</span>}
          {state === 'saved' && <span className="text-ok">tersimpan</span>}
          {state === 'error' && <span className="text-danger">gagal</span>}
          {state === 'idle' && (
            <button
              type="button"
              className="tap text-muted underline underline-offset-2"
              onClick={async () => setHistory(history ? null : await adminFetch(`/prices/history/${row.variantPriceId}`))}
            >
              riwayat
            </button>
          )}
        </span>
      </div>
      {history && (
        <ul className="mt-1 text-[12px] text-muted">
          {history.length === 0 && <li>Belum pernah diubah.</li>}
          {history.map((h, i) => (
            <li key={i}>
              {dateFmt.format(new Date(h.changedAt))}: {formatRupiah(h.oldPrice)} → {formatRupiah(h.newPrice)}
              {h.changedBy && ` (${h.changedBy})`}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function BulkForm({ brands, cats, onDone }: { brands: Brand[]; cats: Category[]; onDone: () => void }) {
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [percent, setPercent] = useState('');
  const [roundTo, setRoundTo] = useState('100');
  const [msg, setMsg] = useState<string | null>(null);
  const dialog = useDialog();

  return (
    <form
      className="mt-3 grid gap-3 rounded-tag border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_110px_130px_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const pct = Number(percent);
        const target = [brands.find((b) => b.id === brandId)?.name, cats.flatMap((c) => [c, ...(c.children ?? [])]).find((c) => c.id === categoryId)?.name]
          .filter(Boolean)
          .join(' + ');
        if (!target) return setMsg('Pilih merek atau kategori.');
        const ok = await dialog.confirm({
          title: `Ubah semua harga ${target}?`,
          message: `Semua harga ${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}% lalu dibulatkan ke Rp${Number(roundTo).toLocaleString('id-ID')}. Setiap perubahan tercatat di riwayat harga.`,
          confirmLabel: `Ubah harga ${pct > 0 ? '+' : ''}${pct}%`,
        });
        if (!ok) return;
        try {
          const r = await adminFetch<{ updated: number }>('/prices/bulk', {
            method: 'POST',
            json: { brandId: brandId || undefined, categoryId: categoryId || undefined, percent: pct, roundTo: Number(roundTo) },
          });
          setMsg(`${r.updated} harga diubah.`);
          onDone();
        } catch (err) {
          setMsg(err instanceof Error ? err.message : 'Gagal');
        }
      }}
    >
      <label className="text-[13px]">
        Merek
        <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={`mt-1 ${inputCls}`}>
          <option value="">Semua</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <label className="text-[13px]">
        Kategori
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`mt-1 ${inputCls}`}>
          <option value="">Semua</option>
          {cats.map((c) => (
            <optgroup key={c.id} label={c.name}>
              <option value={c.id}>{c.name} (semua)</option>
              {c.children?.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="text-[13px]">
        Naik/turun %
        <input type="number" step="0.5" min={-50} max={100} required value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="mis. 5" className={`mt-1 ${inputCls}`} />
      </label>
      <label className="text-[13px]">
        Bulatkan ke
        <select value={roundTo} onChange={(e) => setRoundTo(e.target.value)} className={`mt-1 ${inputCls}`}>
          <option value="100">Rp100</option>
          <option value="500">Rp500</option>
          <option value="1000">Rp1.000</option>
          <option value="1">Tanpa pembulatan</option>
        </select>
      </label>
      <button className={btnPrimary}>Terapkan</button>
      {msg && <p className="text-[14px] sm:col-span-5">{msg}</p>}
    </form>
  );
}

export default function PricesPage() {
  const me = useMe();
  const [q, setQ] = useState('');
  const [brandId, setBrandId] = useState('');
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [data, setData] = useState<{ items: PriceRow[]; total: number } | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const load = useCallback(() => {
    const sp = new URLSearchParams({ page: String(page) });
    if (q.trim()) sp.set('q', q.trim());
    if (brandId) sp.set('brandId', brandId);
    adminFetch<{ items: PriceRow[]; total: number }>(`/prices?${sp}`).then(setData).catch(() => {});
  }, [q, brandId, page]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    adminFetch<Brand[]>('/brands').then(setBrands).catch(() => {});
    adminFetch<Category[]>('/categories').then(setCats).catch(() => {});
  }, []);

  return (
    <>
      <PageTitle actions={me.role === 'owner' && <button className={btnSecondary} onClick={() => setShowBulk(!showBulk)}>Ubah massal %</button>}>Ubah harga</PageTitle>
      {showBulk && <BulkForm brands={brands} cats={cats} onDone={load} />}
      <p className="mt-3 text-[14px] text-muted">Ketik harga baru lalu tekan Enter atau pindah kolom. Tersimpan otomatis dan langsung tampil di website.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input type="search" placeholder="Cari barang" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={`${inputCls} max-w-xs`} />
        <select value={brandId} onChange={(e) => { setBrandId(e.target.value); setPage(1); }} className={`${inputCls} w-auto`}>
          <option value="">Semua merek</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      {!data ? (
        <p className="mt-6 text-muted">Memuat…</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-y border-line bg-surface text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted">
                <th className="px-3 py-2 font-medium">Barang</th>
                <th className="px-3 py-2 font-medium">Satuan</th>
                <th className="px-3 py-2 font-medium">Harga</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.variantPriceId} className="border-b border-line align-top last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{r.productName}</span>
                    {r.variantLabel && <span className="text-muted"> · {r.variantLabel}</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.unit}
                    {r.qtyPerUnit > 1 && <span className="text-muted"> (isi {r.qtyPerUnit})</span>}
                  </td>
                  <td className="px-3 py-1.5">
                    <PriceInput row={r} onSaved={(p) => setData((d) => d && { ...d, items: d.items.map((x) => (x.variantPriceId === r.variantPriceId ? { ...x, price: p } : x)) })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.total > 50 && (
            <div className="mt-4 flex gap-2">
              <button className={btnSecondary} disabled={page === 1} onClick={() => setPage(page - 1)}>← Sebelumnya</button>
              <button className={btnSecondary} disabled={page * 50 >= data.total} onClick={() => setPage(page + 1)}>Berikutnya →</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
