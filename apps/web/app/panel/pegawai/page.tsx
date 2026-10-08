'use client';

import { Check, Copy, WhatsappLogo } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import type { StaffMember, StaffRole } from '@newagung/shared';
import { btnPrimary, btnSecondary, inputCls, PageTitle, useMe } from '@/components/panel/PanelShell';
import { adminFetch } from '@/lib/admin';

export default function StaffPage() {
  const me = useMe();
  const [list, setList] = useState<StaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // tautan undangan tanpa email (bila email undangan tidak bisa dikirim)
  const [invite, setInvite] = useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => adminFetch<StaffMember[]>('/staff').then(setList), []);
  useEffect(() => {
    load().catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, [load]);

  async function update(id: string, patch: Partial<StaffMember>) {
    try {
      await adminFetch(`/staff/${id}`, { method: 'PATCH', json: patch });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Perubahan belum berhasil disimpan' });
    }
  }

  return (
    <div className="max-w-2xl">
      <PageTitle>Pegawai</PageTitle>
      <p className="text-[14px] text-muted">
        Pegawai dapat menambah dan mengubah produk, mengubah harga, serta mengelola pesanan. Hanya pemilik toko yang dapat menghapus produk, mengatur kategori, melakukan import, mengubah info toko, dan mengelola pegawai.
      </p>

      <form
        className="mt-5 flex flex-wrap gap-2 rounded-tag border border-line bg-surface p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          setInvite(null);
          setCopied(false);
          try {
            const res = await adminFetch<{ inviteLink: string | null }>('/staff', { method: 'POST', json: { email, role } });
            if (res.inviteLink) setInvite({ email, link: res.inviteLink });
            else setMsg({ ok: true, text: `Undangan telah dikirim ke ${email}. Pegawai dapat mengatur kata sandi melalui tautan di email tersebut.` });
            setEmail('');
            await load();
          } catch (err) {
            setMsg({ ok: false, text: err instanceof Error ? err.message : 'Undangan belum berhasil dikirim' });
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
      {invite && (
        <div role="status" className="mt-3 rounded-tag border border-line bg-surface p-4 text-[14px]">
          <p className="font-semibold">{invite.email} sudah ditambahkan.</p>
          <p className="mt-1 text-muted">
            Email undangan tidak dikirim (batas pengiriman email Supabase sudah tercapai, atau akun ini sudah pernah diundang). Bagikan tautan
            berikut kepada pegawai untuk mengatur kata sandi. Tautan berlaku 24 jam dan hanya dapat dipakai sekali.
          </p>
          <input readOnly value={invite.link} onFocus={(e) => e.currentTarget.select()} aria-label="Tautan undangan" className={`mt-3 ${inputCls} text-[13px]`} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={async () => {
                await navigator.clipboard.writeText(invite.link);
                setCopied(true);
              }}
            >
              {copied ? <Check size={18} weight="bold" aria-hidden /> : <Copy size={18} weight="bold" aria-hidden />}
              {copied ? 'Tersalin' : 'Salin tautan'}
            </button>
            <a
              className="btn btn-wa"
              target="_blank"
              rel="noopener"
              href={`https://wa.me/?text=${encodeURIComponent(`Halo, Anda diundang sebagai pegawai di panel Toko New Agung. Buka tautan berikut untuk mengatur kata sandi (berlaku 24 jam):\n${invite.link}`)}`}
            >
              <WhatsappLogo size={18} weight="bold" aria-hidden />
              Kirim via WhatsApp
            </a>
          </div>
        </div>
      )}

      <ul className="mt-5 divide-y divide-line rounded-tag border border-line bg-surface">
        {list.length === 0 && <li className="p-4 text-[14px] text-muted">Belum ada pegawai terdaftar.</li>}
        {list.map((s) => (
          <li key={s.userId} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[14px]">
            <span className={`min-w-0 flex-1 truncate ${s.active ? '' : 'text-muted line-through'}`}>{s.email}</span>
            {s.userId === me.userId ? (
              <span className="text-muted">Anda ({s.role === 'owner' ? 'pemilik' : 'pegawai'})</span>
            ) : (
              <>
                <select value={s.role} onChange={(e) => update(s.userId, { role: e.target.value as StaffRole })} className={`${inputCls} w-auto`} aria-label={`Peran ${s.email}`}>
                  <option value="staff">Pegawai</option>
                  <option value="owner">Pemilik</option>
                </select>
                <button onClick={() => update(s.userId, { active: !s.active })} className="tap text-[13px] font-semibold text-brand-text">
                  {s.active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
