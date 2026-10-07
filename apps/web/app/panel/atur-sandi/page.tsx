'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btnPrimary, inputCls } from '@/components/panel/PanelShell';
import { updatePassword } from '@/lib/admin';

/** Tujuan link undangan pegawai & reset kata sandi dari email Supabase */
export default function SetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-tag border border-line bg-surface p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return setError('Minimal 8 karakter');
          setBusy(true);
          try {
            await updatePassword(pw);
            router.replace('/panel');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menyimpan');
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="text-[22px] font-bold">Atur kata sandi</h1>
        <div>
          <label htmlFor="pw" className="text-[14px] font-semibold">
            Kata sandi baru
          </label>
          <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        {error && <p className="text-[14px] text-danger">{error}</p>}
        <button disabled={busy} className={`${btnPrimary} w-full`}>
          Simpan dan masuk
        </button>
      </form>
    </div>
  );
}
