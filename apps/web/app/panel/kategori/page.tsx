'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Brand, Category } from '@newagung/shared';
import { btnPrimary, btnSecondary, inputCls, PageTitle, useMe } from '@/components/panel/PanelShell';
import { useDialog } from '@/components/panel/Dialog';
import { adminFetch } from '@/lib/admin';

export default function CategoriesAdminPage() {
  const me = useMe();
  const isOwner = me.role === 'owner';
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const dialog = useDialog();

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([adminFetch<Category[]>('/categories'), adminFetch<Brand[]>('/brands')]);
    setCats(c);
    setBrands(b);
  }, []);
  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal');
    }
  }

  const rename = async (c: Category) => {
    const name = await dialog.prompt({ title: 'Ganti nama kategori', label: 'Nama kategori', defaultValue: c.name, confirmLabel: 'Simpan nama' });
    if (name && name !== c.name)
      void run(() => adminFetch(`/categories/${c.id}`, { method: 'PUT', json: { name, parentId: c.parentId, sortOrder: c.sortOrder } }));
  };
  const del = async (c: Category) => {
    const ok = await dialog.confirm({
      title: `Hapus kategori “${c.name}”?`,
      message: (() => {
        const kids = c.children ?? [];
        const direct = c.productCount - kids.reduce((n, k) => n + k.productCount, 0);
        const own = direct > 0 ? `${direct} barang yang langsung ada di sini tetap ada, tapi tanpa kategori sampai dipindahkan.` : 'Tidak ada barang yang langsung ada di kategori ini.';
        return kids.length ? `${own} ${kids.length} sub-kategorinya menjadi kategori utama beserta barangnya.` : own;
      })(),
      confirmLabel: 'Hapus kategori',
      danger: true,
    });
    if (ok) void run(() => adminFetch(`/categories/${c.id}`, { method: 'DELETE' }));
  };

  const move = (list: Category[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((c) => c.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void run(() => adminFetch('/categories/reorder', { method: 'POST', json: { ids } }));
  };

  const actions = (c: Category, list: Category[], i: number) =>
    isOwner && (
      <span className="ml-auto flex shrink-0 gap-1 text-[13px]">
        <button onClick={() => move(list, i, -1)} disabled={i === 0} className="tap px-1.5 text-muted disabled:opacity-30" aria-label={`Naikkan ${c.name}`}>↑</button>
        <button onClick={() => move(list, i, 1)} disabled={i === list.length - 1} className="tap px-1.5 text-muted disabled:opacity-30" aria-label={`Turunkan ${c.name}`}>↓</button>
        <button onClick={() => rename(c)} className="tap px-1.5 text-brand-text">Ganti nama</button>
        <button onClick={() => del(c)} className="tap px-1.5 text-muted hover:text-danger">Hapus</button>
      </span>
    );

  return (
    <>
      <PageTitle>Kategori & merek</PageTitle>
      {error && <p className="mb-4 text-danger">{error}</p>}
      {!isOwner && <p className="mb-4 text-[14px] text-muted">Hanya pemilik yang bisa mengubah kategori.</p>}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <ul className="space-y-3">
            {cats.map((c, i) => (
              <li key={c.id} className="rounded-tag border border-line bg-surface">
                <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                  <span className="signage text-[14px]">{c.name}</span>
                  <span className="text-[12px] text-muted tabular-nums">{c.productCount} barang</span>
                  {actions(c, cats, i)}
                </div>
                {c.children && c.children.length > 0 && (
                  <ul className="divide-y divide-line">
                    {c.children.map((ch, ci) => (
                      <li key={ch.id} className="flex items-center gap-2 py-1.5 pr-3 pl-6 text-[14px]">
                        {ch.name} <span className="text-[12px] text-muted tabular-nums">{ch.productCount}</span>
                        {actions(ch, c.children!, ci)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {isOwner && (
            <form
              className="mt-4 flex flex-wrap gap-2 rounded-tag border border-dashed border-field p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                void run(async () => {
                  await adminFetch('/categories', { method: 'POST', json: { name: newName.trim(), parentId: newParent || null, sortOrder: 999 } });
                  setNewName('');
                });
              }}
            >
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama kategori baru" className={`${inputCls} max-w-xs`} />
              <select value={newParent} onChange={(e) => setNewParent(e.target.value)} className={`${inputCls} w-auto`}>
                <option value="">Kategori utama (papan lorong)</option>
                {cats.map((c) => <option key={c.id} value={c.id}>Di bawah: {c.name}</option>)}
              </select>
              <button className={btnPrimary}>Tambah</button>
            </form>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Merek</h2>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBrand.trim()) return;
              void run(async () => {
                await adminFetch('/brands', { method: 'POST', json: { name: newBrand.trim() } });
                setNewBrand('');
              });
            }}
          >
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Merek baru" className={inputCls} />
            <button className={btnSecondary}>Tambah</button>
          </form>
          <ul className="divide-y divide-line rounded-tag border border-line bg-surface">
            {brands.map((b) => (
              <li key={b.id} className="flex items-center gap-2 px-3 py-2 text-[14px]">
                {b.name} <span className="text-[12px] text-muted tabular-nums">{b.productCount}</span>
                {isOwner && (
                  <span className="ml-auto flex gap-1 text-[13px]">
                    <button
                      className="tap px-1.5 text-brand-text"
                      onClick={async () => {
                        const name = await dialog.prompt({ title: 'Ganti nama merek', label: 'Nama merek', defaultValue: b.name, confirmLabel: 'Simpan nama' });
                        if (name && name !== b.name) void run(() => adminFetch(`/brands/${b.id}`, { method: 'PUT', json: { name } }));
                      }}
                    >
                      Ganti nama
                    </button>
                    <button
                      className="tap px-1.5 text-muted hover:text-danger"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          title: `Hapus merek “${b.name}”?`,
                          message: `${b.productCount ?? 0} barang tetap ada, tapi tanpa merek.`,
                          confirmLabel: 'Hapus merek',
                          danger: true,
                        });
                        if (ok) void run(() => adminFetch(`/brands/${b.id}`, { method: 'DELETE' }));
                      }}
                    >
                      Hapus
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
