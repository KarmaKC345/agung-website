'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StaffMember, StaffRole } from '@newagung/shared';
import { btnPrimary, inputCls, PageTitle, useMe } from '@/components/panel/PanelShell';
import { adminFetch } from '@/lib/admin';

export default function StaffPage() {
  const me = useMe();
  const [list, setList] = useState<StaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => adminFetch<StaffMember[]>('/staff').then(setList), []);
  useEffect(() => {
    load().catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, [load]);

  async function update(id: string, patch: Partial<StaffMember>) {
    try {
      await adminFetch(`/staff/${id}`, { method: 'PATCH', json: patch });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Gagal' });
    }
  }

  return (
    <div className="max-w-2xl">
      <PageTitle>Pegawai</PageTitle>
      <p className="text-[14px] text-muted">
        Pegawai bisa menambah/mengubah barang, mengubah harga, dan mengurus pesanan. Hanya pemilik yang bisa menghapus barang, mengatur kategori, import, info toko, dan pegawai.
      </p>

      <form
        className="mt-5 flex flex-wrap gap-2 rounded-tag border border-line bg-surface p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          try {
            await adminFetch('/staff', { method: 'POST', json: { email, role } });
            setMsg({ ok: true, text: `Undangan dikirim ke ${email}. Pegawai mengatur kata sandi dari link di email.` });
            setEmail('');
            await load();
          } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal mengundang' });
          }
        }}
      >
        <input type="email" required placeholder="email pegawai" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} max-w-xs`} />
        <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={`${inputCls} w-auto`}>
          <option value="staff">Pegawai</option>
          <option value="owner">Pemilik</option>
        </select>
        <button className={btnPrimary}>Undang</button>
      </form>
      {msg && <p className={`mt-3 text-[14px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</p>}

      <ul className="mt-5 divide-y divide-line rounded-tag border border-line bg-surface">
        {list.length === 0 && <li className="p-4 text-[14px] text-muted">Belum ada pegawai terdaftar.</li>}
        {list.map((s) => (
          <li key={s.userId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[14px]">
            <span className={`min-w-0 flex-1 truncate ${s.active ? '' : 'text-muted line-through'}`}>{s.email}</span>
            {s.userId === me.userId ? (
              <span className="text-muted">Anda ({s.role === 'owner' ? 'pemilik' : 'pegawai'})</span>
            ) : (
              <>
                <select value={s.role} onChange={(e) => update(s.userId, { role: e.target.value as StaffRole })} className={`${inputCls} h-9 w-auto`} aria-label={`Peran ${s.email}`}>
                  <option value="staff">Pegawai</option>
                  <option value="owner">Pemilik</option>
                </select>
                <button onClick={() => update(s.userId, { active: !s.active })} className="text-[13px] font-semibold text-brand-text">
                  {s.active ? 'Nonaktifkan' : 'Aktifkan lagi'}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
