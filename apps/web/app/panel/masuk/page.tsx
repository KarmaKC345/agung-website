'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { inputCls, btnPrimary } from '@/components/panel/PanelShell';
import { LogoMark } from '@/components/Logo';
import { sendReset, signIn } from '@/lib/admin';
import { HAS_SUPABASE } from '@/lib/config';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const next = params.get('lanjut')?.startsWith('/panel') ? params.get('lanjut')! : '/panel';

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          await signIn(email, password);
          router.replace(next);
        } catch (err) {
          setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Gagal masuk' });
        } finally {
          setBusy(false);
        }
      }}
    >
      {HAS_SUPABASE ? (
        <div>
          <label htmlFor="email" className="text-[14px] font-semibold">
            Email
          </label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
      ) : (
        <p className="rounded-tag bg-sunken p-3 text-[13px] text-muted">
          Mode lokal (Supabase belum diatur). Kata sandi = nilai <code>DEV_AUTH_TOKEN</code> di API.
        </p>
      )}
      <div>
        <label htmlFor="password" className="text-[14px] font-semibold">
          Kata sandi
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 ${inputCls}`}
        />
      </div>
      {msg && (
        <p role="alert" className={`text-[14px] ${msg.kind === 'error' ? 'text-danger' : 'text-ok'}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? 'Masuk…' : 'Masuk'}
      </button>
      {HAS_SUPABASE && (
        <button
          type="button"
          className="w-full text-[14px] text-muted underline underline-offset-4"
          onClick={async () => {
            if (!email) return setMsg({ kind: 'error', text: 'Isi email dulu, lalu tekan “Lupa kata sandi”.' });
            try {
              await sendReset(email);
              setMsg({ kind: 'info', text: 'Link untuk mengatur kata sandi baru sudah dikirim ke email.' });
            } catch (err) {
              setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim email' });
            }
          }}
        >
          Lupa kata sandi
        </button>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-tag border border-line bg-surface p-6">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-3 text-[22px] font-bold">Masuk panel toko</h1>
        <p className="text-[14px] text-muted">Khusus pemilik dan pegawai New Agung.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
