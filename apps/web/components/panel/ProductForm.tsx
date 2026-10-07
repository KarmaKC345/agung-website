'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Brand, Category, ProductDetail, StockStatus } from '@newagung/shared';
import { adminFetch, compressImage, getToken } from '@/lib/admin';
import { API_URL } from '@/lib/config';
import { btnPrimary, btnSecondary, inputCls, PageTitle, useMe } from './PanelShell';

interface PriceDraft {
  unit: string;
  qtyPerUnit: number;
  price: number | '';
}
interface VariantDraft {
  key: string;
  id?: string;
  label: string;
  colorHex: string | null;
  sku: string;
  stockStatus: StockStatus;
  prices: PriceDraft[];
}

const UNITS = ['pcs', 'lusin', 'pak', 'box', 'rim', 'kotak', 'set', 'botol', 'tabung', 'roll', 'lembar'];
let keySeq = 0;
const newKey = () => `v${++keySeq}`;
const emptyVariant = (): VariantDraft => ({ key: newKey(), label: '', colorHex: null, sku: '', stockStatus: 'ada', prices: [{ unit: 'pcs', qtyPerUnit: 1, price: '' }] });

export function ProductForm({ product }: { product?: ProductDetail }) {
  const router = useRouter();
  const me = useMe();
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '');
  const [brandId, setBrandId] = useState(product?.brand?.id ?? '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map((v) => ({
      key: newKey(),
      id: v.id,
      label: v.label,
      colorHex: v.colorHex,
      sku: v.sku ?? '',
      stockStatus: v.stockStatus,
      prices: v.prices.map((p) => ({ unit: p.unit, qtyPerUnit: p.qtyPerUnit, price: p.price })),
    })) ?? [emptyVariant()],
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Category[]>('/categories').then(setCats).catch(() => {});
    adminFetch<Brand[]>('/brands').then(setBrands).catch(() => {});
  }, []);

  const setVariant = (key: string, patch: Partial<VariantDraft>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  async function upload(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      for (const f of Array.from(files).slice(0, 5 - images.length)) {
        const blob = await compressImage(f);
        form.append('files', blob, `${f.name.replace(/\.\w+$/, '')}.webp`);
      }
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/admin/uploads`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengunggah');
      setImages((imgs) => [...imgs, ...(data.urls as string[])].slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  }

  async function addBrand() {
    const n = prompt('Nama merek baru');
    if (!n?.trim()) return;
    try {
      const b = await adminFetch<Brand>('/brands', { method: 'POST', json: { name: n.trim() } });
      setBrands((bs) => [...bs, b].sort((a, c) => a.name.localeCompare(c.name)));
      setBrandId(b.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambah merek');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name,
      description,
      categoryId: categoryId || null,
      brandId: brandId || null,
      isActive,
      images,
      variants: variants.map((v) => ({
        id: v.id,
        label: v.label.trim(),
        colorHex: v.colorHex,
        sku: v.sku.trim() || null,
        stockStatus: v.stockStatus,
        prices: v.prices.map((p) => ({ unit: p.unit.trim(), qtyPerUnit: Number(p.qtyPerUnit) || 1, price: Number(p.price) })),
      })),
    };
    if (body.variants.some((v) => v.prices.some((p) => !Number.isFinite(p.price) || String(p.price) === ''))) {
      setBusy(false);
      return setError('Semua harga wajib diisi angka.');
    }
    try {
      if (product) await adminFetch(`/products/${product.id}`, { method: 'PUT', json: body });
      else await adminFetch('/products', { method: 'POST', json: body });
      router.push('/panel/barang');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!product || !confirm(`Hapus “${product.name}” permanen? Untuk sementara menyembunyikan, matikan “Tampil di website”.`)) return;
    await adminFetch(`/products/${product.id}`, { method: 'DELETE' });
    router.push('/panel/barang');
  }

  return (
    <form onSubmit={save} className="max-w-3xl">
      <PageTitle actions={product && <Link href={`/barang/${product.slug}`} target="_blank" className={btnSecondary}>Lihat di website</Link>}>
        {product ? 'Ubah barang' : 'Tambah barang'}
      </PageTitle>

      <section className="space-y-4 rounded-tag border border-line bg-surface p-4">
        <div>
          <label className="text-[14px] font-semibold" htmlFor="name">Nama barang</label>
          <input id="name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Pentel Energel BLN105 0.5" className={`mt-1 ${inputCls}`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[14px] font-semibold" htmlFor="cat">Kategori</label>
            <select id="cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`mt-1 ${inputCls}`}>
              <option value="">— Tanpa kategori —</option>
              {cats.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  <option value={c.id}>{c.name}</option>
                  {c.children?.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[14px] font-semibold" htmlFor="brand">Merek</label>
            <div className="mt-1 flex gap-2">
              <select id="brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                <option value="">— Tanpa merek —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button type="button" onClick={addBrand} className={btnSecondary}>Baru</button>
            </div>
          </div>
        </div>
        <div>
          <label className="text-[14px] font-semibold" htmlFor="desc">Keterangan singkat</label>
          <textarea id="desc" rows={2} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="mis. isi 500 lembar per rim" className={`mt-1 ${inputCls} h-auto py-2`} />
        </div>
        <label className="flex items-center gap-2 text-[15px]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-5" />
          Tampil di website
        </label>
      </section>

      <section className="mt-5 rounded-tag border border-line bg-surface p-4">
        <h2 className="font-semibold">Foto <span className="font-normal text-muted">({images.length}/5)</span></h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {images.map((src, i) => (
            <li key={src} className="relative size-24 overflow-hidden rounded-tag border border-line bg-white">
              <Image src={src} alt="" fill sizes="96px" className="object-contain" />
              {i === 0 && <span className="absolute bottom-0 left-0 bg-ink px-1 text-[10px] text-surface">utama</span>}
              <button type="button" onClick={() => setImages(images.filter((x) => x !== src))} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-surface text-[14px] ring-1 ring-line" aria-label="Hapus foto">×</button>
              {i > 0 && (
                <button type="button" onClick={() => setImages([src, ...images.filter((x) => x !== src)])} className="absolute bottom-1 right-1 rounded bg-surface px-1 text-[10px] ring-1 ring-line">jadikan utama</button>
              )}
            </li>
          ))}
          {images.length < 5 && (
            <li>
              <label className="grid size-24 cursor-pointer place-items-center rounded-tag border border-dashed border-line-strong text-center text-[13px] text-muted hover:border-ink">
                {uploading ? 'Mengunggah…' : '+ Foto / kamera'}
                <input type="file" accept="image/*" capture="environment" multiple className="sr-only" disabled={uploading} onChange={(e) => e.target.files && upload(e.target.files)} />
              </label>
            </li>
          )}
        </ul>
        <p className="mt-2 text-[13px] text-muted">Foto dikecilkan otomatis sebelum diunggah. Latar polos & terang paling bagus.</p>
      </section>

      <section className="mt-5 rounded-tag border border-line bg-surface p-4">
        <h2 className="font-semibold">Varian & harga</h2>
        <p className="text-[13px] text-muted">Satu varian per warna/ukuran. Satu barang tanpa pilihan cukup satu varian dengan nama kosong.</p>
        <div className="mt-4 space-y-4">
          {variants.map((v, vi) => (
            <fieldset key={v.key} className="rounded-tag border border-line p-3">
              <legend className="px-1 text-[13px] text-muted">Varian {vi + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                <input value={v.label} onChange={(e) => setVariant(v.key, { label: e.target.value })} placeholder="Nama varian (mis. Biru, 58 lembar)" className={inputCls} aria-label="Nama varian" />
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={v.colorHex !== null} onChange={(e) => setVariant(v.key, { colorHex: e.target.checked ? '#1F3FAE' : null })} />
                  Warna
                  {v.colorHex !== null && <input type="color" value={v.colorHex} onChange={(e) => setVariant(v.key, { colorHex: e.target.value.toUpperCase() })} className="h-8 w-10" aria-label="Pilih warna" />}
                </label>
                <input value={v.sku} onChange={(e) => setVariant(v.key, { sku: e.target.value })} placeholder="Kode kasir (opsional)" className={inputCls} aria-label="Kode kasir" />
                <select value={v.stockStatus} onChange={(e) => setVariant(v.key, { stockStatus: e.target.value as StockStatus })} className={`${inputCls} w-auto`} aria-label="Stok">
                  <option value="ada">Ada</option>
                  <option value="sedikit">Sisa sedikit</option>
                  <option value="habis">Habis</option>
                </select>
              </div>
              <table className="mt-3 w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th className="pb-1 font-medium">Satuan</th>
                    <th className="pb-1 font-medium">Isi</th>
                    <th className="pb-1 font-medium">Harga (Rp)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {v.prices.map((p, pi) => (
                    <tr key={pi}>
                      <td className="pr-2 pb-2">
                        <input list="units" value={p.unit} required onChange={(e) => setVariant(v.key, { prices: v.prices.map((x, i) => (i === pi ? { ...x, unit: e.target.value } : x)) })} className={inputCls} aria-label="Satuan" />
                      </td>
                      <td className="w-20 pr-2 pb-2">
                        <input type="number" min={1} value={p.qtyPerUnit} onChange={(e) => setVariant(v.key, { prices: v.prices.map((x, i) => (i === pi ? { ...x, qtyPerUnit: Number(e.target.value) } : x)) })} className={inputCls} aria-label="Isi per satuan" />
                      </td>
                      <td className="pr-2 pb-2">
                        <input type="number" min={0} required inputMode="numeric" value={p.price} onChange={(e) => setVariant(v.key, { prices: v.prices.map((x, i) => (i === pi ? { ...x, price: e.target.value === '' ? '' : Number(e.target.value) } : x)) })} className={`${inputCls} tabular-nums`} aria-label="Harga" />
                      </td>
                      <td className="pb-2">
                        {v.prices.length > 1 && (
                          <button type="button" onClick={() => setVariant(v.key, { prices: v.prices.filter((_, i) => i !== pi) })} className="px-2 text-muted hover:text-danger" aria-label="Hapus satuan">×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap gap-3 text-[13px]">
                {v.prices.length < 6 && (
                  <button type="button" onClick={() => setVariant(v.key, { prices: [...v.prices, { unit: 'lusin', qtyPerUnit: 12, price: '' }] })} className="font-semibold text-brand-text">+ Satuan (lusin/box…)</button>
                )}
                <button type="button" onClick={() => setVariants([...variants.slice(0, vi + 1), { ...v, key: newKey(), id: undefined, label: '', prices: v.prices.map((p) => ({ ...p })) }, ...variants.slice(vi + 1)])} className="font-semibold text-brand-text">Salin varian</button>
                {variants.length > 1 && (
                  <button type="button" onClick={() => setVariants(variants.filter((x) => x.key !== v.key))} className="ml-auto text-muted hover:text-danger">Hapus varian</button>
                )}
              </div>
            </fieldset>
          ))}
        </div>
        <button type="button" onClick={() => setVariants([...variants, emptyVariant()])} className={`${btnSecondary} mt-3`}>+ Tambah varian</button>
        <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
      </section>

      {error && <p role="alert" className="mt-4 font-medium text-danger">{error}</p>}
      <div className="sticky bottom-0 mt-5 flex gap-2 border-t border-line bg-paper py-3">
        <button disabled={busy} className={btnPrimary}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        <Link href="/panel/barang" className={btnSecondary}>Batal</Link>
        {product && me.role === 'owner' && (
          <button type="button" onClick={remove} className="ml-auto text-[14px] text-muted underline underline-offset-4 hover:text-danger">Hapus barang</button>
        )}
      </div>
    </form>
  );
}
