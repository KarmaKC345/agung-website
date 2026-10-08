'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import type { PromoBanner } from '@newagung/shared';
import { useDialog } from '@/components/panel/Dialog';
import { btnPrimary, btnSecondary, inputCls, PageTitle } from '@/components/panel/PanelShell';
import { adminFetch, compressImage, getToken } from '@/lib/admin';
import { API_URL } from '@/lib/config';

type Draft = Omit<PromoBanner, 'id' | 'startsAt' | 'endsAt'> & { id?: string; startsAt: string; endsAt: string };

const THEMES: { value: PromoBanner['theme']; label: string; cls: string }[] = [
  { value: 'brand', label: 'Biru', cls: 'bg-brand' },
  { value: 'signal', label: 'Merah (promo)', cls: 'bg-signal' },
  { value: 'ink', label: 'Gelap', cls: 'bg-ink' },
];

const LINKS = [
  { value: '/barang?promo=1', label: 'Semua barang promo' },
  { value: '/barang?sort=terlaris', label: 'Barang terlaris' },
  { value: '/barang', label: 'Katalog' },
  { value: '/kategori', label: 'Daftar kategori' },
  { value: '/tentang', label: 'Tentang toko' },
];

/** ISO → nilai <input type="datetime-local"> dalam WITA */
function toLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 8 * 3600_000);
  return d.toISOString().slice(0, 16);
}
const toIso = (local: string) => (local ? `${local}:00+08:00` : null);

const empty = (sortOrder: number): Draft => ({
  title: '',
  subtitle: '',
  imageUrl: null,
  linkUrl: '/barang?promo=1',
  theme: 'signal',
  sortOrder,
  isActive: true,
  startsAt: '',
  endsAt: '',
});

function status(b: PromoBanner): { label: string; cls: string } {
  const now = Date.now();
  if (!b.isActive) return { label: 'Disembunyikan', cls: 'bg-sunken text-muted' };
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return { label: 'Terjadwal', cls: 'bg-brand-tint text-brand-text' };
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return { label: 'Selesai', cls: 'bg-sunken text-muted' };
  return { label: 'Tampil', cls: 'bg-ok/15 text-ok' };
}

export default function BannerAdminPage() {
  const dialog = useDialog();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => adminFetch<PromoBanner[]>('/banners').then(setBanners), []);
  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [load]);

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('files', await compressImage(file, 2000), `${file.name.replace(/\.\w+$/, '')}.webp`);
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/uploads`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengunggah');
      set({ imageUrl: (data.urls as string[])[0] ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    const { id, ...rest } = draft;
    const body = { ...rest, startsAt: toIso(draft.startsAt), endsAt: toIso(draft.endsAt) };
    try {
      if (id) await adminFetch(`/banners/${id}`, { method: 'PUT', json: body });
      else await adminFetch('/banners', { method: 'POST', json: body });
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  async function remove(b: PromoBanner) {
    const ok = await dialog.confirm({ title: `Hapus banner “${b.title}”?`, message: 'Banner hilang dari beranda. Untuk menyembunyikan sementara, matikan “Tampil”.', confirmLabel: 'Hapus banner', danger: true });
    if (!ok) return;
    await adminFetch(`/banners/${b.id}`, { method: 'DELETE' }).catch((e: Error) => setError(e.message));
    await load();
  }

  return (
    <div className="max-w-4xl">
      <PageTitle
        actions={
          !draft && (
            <button className={btnPrimary} onClick={() => setDraft(empty((banners.at(-1)?.sortOrder ?? 0) + 1))}>
              + Banner baru
            </button>
          )
        }
      >
        Banner beranda
      </PageTitle>
      <p className="-mt-3 mb-5 max-w-[65ch] text-[14px] text-muted">
        Banner tampil bergantian di bagian atas beranda. Pakai untuk promo, barang baru masuk, atau info toko. Banner dengan tanggal selesai hilang sendiri.
      </p>
      {error && <p role="alert" className="mb-4 font-medium text-danger">{error}</p>}

      {draft && (
        <form onSubmit={save} className="mb-8 space-y-4 rounded-tag border border-line bg-surface p-4">
          <h2 className="font-semibold">{draft.id ? 'Ubah banner' : 'Banner baru'}</h2>

          {/* Pratinjau, sama seperti di beranda */}
          <div className={`relative aspect-[2/1] overflow-hidden rounded-[var(--radius-media)] sm:aspect-[3/1] ${THEMES.find((t) => t.value === draft.theme)!.cls}`}>
            {draft.imageUrl && <Image src={draft.imageUrl} alt="" fill sizes="800px" className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center p-5 text-white">
              <p className="text-[20px] leading-tight font-bold sm:text-[26px]">{draft.title || 'Judul banner'}</p>
              {draft.subtitle && <p className="mt-1.5 text-[14px] opacity-90">{draft.subtitle}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[14px] font-semibold">
              Judul <span className="font-normal text-muted">({draft.title.length}/80)</span>
              <input required maxLength={80} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="mis. Diskon kertas A4 minggu ini" className={`mt-1 ${inputCls}`} />
            </label>
            <label className="block text-[14px] font-semibold">
              Keterangan <span className="font-normal text-muted">(opsional)</span>
              <input maxLength={140} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="mis. Berlaku sampai stok habis" className={`mt-1 ${inputCls}`} />
            </label>
            <label className="block text-[14px] font-semibold">
              Saat diklik buka
              <input list="banner-links" required value={draft.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} className={`mt-1 ${inputCls}`} />
              <datalist id="banner-links">
                {LINKS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </datalist>
              <span className="mt-1 block text-[12px] font-normal text-muted">Halaman di website ini, mis. /barang?promo=1 atau /kategori/kertas</span>
            </label>
            <fieldset>
              <legend className="text-[14px] font-semibold">Warna latar (bila tanpa foto)</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button key={t.value} type="button" aria-pressed={draft.theme === t.value} onClick={() => set({ theme: t.value })} className="chip tap">
                    <span className={`size-3 rounded-full ${t.cls}`} aria-hidden />
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-[14px] font-semibold">
              Mulai tampil <span className="font-normal text-muted">(WITA, opsional)</span>
              <input type="datetime-local" value={draft.startsAt} onChange={(e) => set({ startsAt: e.target.value })} className={`mt-1 ${inputCls}`} />
            </label>
            <label className="block text-[14px] font-semibold">
              Selesai <span className="font-normal text-muted">(WITA, opsional)</span>
              <input type="datetime-local" value={draft.endsAt} min={draft.startsAt || undefined} onChange={(e) => set({ endsAt: e.target.value })} className={`mt-1 ${inputCls}`} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className={`${btnSecondary} cursor-pointer`}>
              {uploading ? 'Mengunggah…' : draft.imageUrl ? 'Ganti foto' : '+ Foto'}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {draft.imageUrl && (
              <button type="button" onClick={() => set({ imageUrl: null })} className="tap text-[14px] text-muted hover:text-danger">
                Hapus foto
              </button>
            )}
            <span className="text-[13px] text-muted">Foto mendatar (lebar 3:1) paling pas. Tulisan selalu di kiri.</span>
          </div>

          <label className="flex min-h-11 items-center gap-2 text-[15px]">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="size-5" />
            Tampil di beranda
          </label>

          <div className="flex gap-2 border-t border-line pt-4">
            <button disabled={busy || uploading} className={btnPrimary}>{busy ? 'Menyimpan…' : 'Simpan banner'}</button>
            <button type="button" onClick={() => setDraft(null)} className={btnSecondary}>Batal</button>
          </div>
        </form>
      )}

      {banners.length === 0 ? (
        <p className="rounded-tag border border-dashed border-field p-8 text-center text-muted">Belum ada banner. Beranda menampilkan foto toko sebagai gantinya.</p>
      ) : (
        <ul className="divide-y divide-line rounded-tag border border-line bg-surface">
          {banners.map((b) => {
            const s = status(b);
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className={`relative h-14 w-28 shrink-0 overflow-hidden rounded-[8px] ${THEMES.find((t) => t.value === b.theme)!.cls}`}>
                  {b.imageUrl && <Image src={b.imageUrl} alt="" fill sizes="112px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.title}</p>
                  <p className="truncate text-[13px] text-muted">{b.linkUrl}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${s.cls}`}>{s.label}</span>
                <span className="flex gap-1 text-[14px]">
                  <button
                    className="tap px-2 font-semibold text-brand-text"
                    onClick={() => setDraft({ ...b, startsAt: toLocal(b.startsAt), endsAt: toLocal(b.endsAt) })}
                  >
                    Ubah
                  </button>
                  <button className="tap px-2 text-muted hover:text-danger" onClick={() => remove(b)}>
                    Hapus
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
