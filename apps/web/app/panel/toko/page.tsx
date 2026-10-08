'use client';

import { useEffect, useState } from 'react';
import { DAY_LABEL, DAY_ORDER, type StoreInfo } from '@newagung/shared';
import { btnPrimary, inputCls, PageTitle } from '@/components/panel/PanelShell';
import { adminFetch } from '@/lib/admin';

export default function StoreSettingsPage() {
  const [s, setS] = useState<StoreInfo | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<StoreInfo>('/store').then(setS).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);
  if (!s) return <p className="text-muted">{msg?.text ?? 'Memuat…'}</p>;

  const set = (patch: Partial<StoreInfo>) => setS({ ...s, ...patch });
  const field = (label: string, key: 'name' | 'address' | 'mapsUrl' | 'phone' | 'whatsapp', hint?: string) => (
    <label className="block text-[14px] font-semibold">
      {label}
      <input value={s[key]} onChange={(e) => set({ [key]: e.target.value })} className={`mt-1 font-normal ${inputCls}`} />
      {hint && <span className="mt-1 block text-[12px] font-normal text-muted">{hint}</span>}
    </label>
  );

  return (
    <form
      className="max-w-2xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const saved = await adminFetch<StoreInfo>('/store', { method: 'PUT', json: s });
          setS(saved);
          setMsg({ ok: true, text: 'Perubahan tersimpan dan website telah diperbarui.' });
        } catch (err) {
          setMsg({ ok: false, text: err instanceof Error ? err.message : 'Perubahan belum berhasil disimpan' });
        } finally {
          setBusy(false);
        }
      }}
    >
      <PageTitle>Info toko</PageTitle>
      <section className="space-y-4 rounded-tag border border-line bg-surface p-4">
        {field('Nama toko', 'name')}
        {field('Alamat', 'address')}
        {field('Link Google Maps', 'mapsUrl')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Nomor WhatsApp', 'whatsapp', 'Format 62…, contoh: 6282348485101')}
          {field('Telepon', 'phone', 'Contoh: 0411850555')}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[14px] font-semibold">
            Lintang (latitude)
            <input type="number" step="any" value={s.lat ?? ''} onChange={(e) => set({ lat: e.target.value === '' ? null : Number(e.target.value) })} className={`mt-1 font-normal ${inputCls}`} />
          </label>
          <label className="block text-[14px] font-semibold">
            Bujur (longitude)
            <input type="number" step="any" value={s.lng ?? ''} onChange={(e) => set({ lng: e.target.value === '' ? null : Number(e.target.value) })} className={`mt-1 font-normal ${inputCls}`} />
          </label>
          <p className="text-[12px] text-muted sm:col-span-2">Opsional. Di Google Maps, tekan lama titik lokasi toko, lalu salin angka koordinatnya.</p>
        </div>
      </section>

      <section className="mt-5 rounded-tag border border-line bg-surface p-4">
        <h2 className="font-semibold">Jam buka (WITA)</h2>
        <table className="mt-3 text-[14px]">
          <tbody>
            {DAY_ORDER.map((d) => {
              const h = s.openingHours[d] ?? null;
              const setDay = (v: typeof h) => set({ openingHours: { ...s.openingHours, [d]: v } });
              return (
                <tr key={d}>
                  <th className="py-1 pr-4 text-left font-medium">{DAY_LABEL[d]}</th>
                  <td className="py-1 pr-3">
                    <label className="flex min-h-11 items-center gap-2">
                      <input type="checkbox" className="size-5" checked={h !== null} onChange={(e) => setDay(e.target.checked ? { open: '05:00', close: '22:00' } : null)} />
                      Buka
                    </label>
                  </td>
                  <td className="py-1">
                    {h ? (
                      <span className="flex items-center gap-2">
                        <input type="time" value={h.open} onChange={(e) => setDay({ ...h, open: e.target.value })} className={`${inputCls} w-28`} aria-label={`${DAY_LABEL[d]} buka`} />-
                        <input type="time" value={h.close} onChange={(e) => setDay({ ...h, close: e.target.value })} className={`${inputCls} w-28`} aria-label={`${DAY_LABEL[d]} tutup`} />
                      </span>
                    ) : (
                      <span className="text-muted">Tutup</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {msg && <p className={`mt-4 font-medium ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</p>}
      <button disabled={busy} className={`${btnPrimary} mt-5`}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
    </form>
  );
}
