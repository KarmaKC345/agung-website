'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { btnPrimary, btnSecondary, inputCls } from '@/components/panel/PanelShell';
import { LogoMark } from '@/components/Logo';
import { sendReset, signIn } from '@/lib/admin';
import { API_URL, HAS_SUPABASE } from '@/lib/config';

type Msg = { kind: 'error' | 'info'; text: string } | null;

/** Login email + kata sandi lewat Supabase Auth, plus link untuk membuat/mengganti kata sandi */
function SupabaseLogin({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function sendLink() {
    if (!email) return setMsg({ kind: 'error', text: 'Isi email Anda terlebih dahulu, lalu tekan tombol ini kembali.' });
    setBusy(true);
    setMsg(null);
    try {
      await sendReset(email);
      setMsg({ kind: 'info', text: `Tautan untuk membuat kata sandi telah dikirim ke ${email}. Buka email tersebut di perangkat ini, lalu atur kata sandi Anda.` });
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Email belum berhasil dikirim' });
    } finally {
      setBusy(false);
    }
  }

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
          setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Belum berhasil masuk. Periksa kembali email dan kata sandi Anda.' });
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="email" className="text-[14px] font-semibold">
          Email
        </label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${inputCls}`} />
      </div>
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
        <p role={msg.kind === 'error' ? 'alert' : 'status'} className={`text-[14px] ${msg.kind === 'error' ? 'text-danger' : 'text-ok'}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? 'Memproses…' : 'Masuk'}
      </button>
      <div className="border-t border-line pt-4">
        <p className="text-[14px] text-muted">Belum memiliki kata sandi atau lupa kata sandi?</p>
        <button type="button" disabled={busy} onClick={sendLink} className={`${btnSecondary} mt-2 w-full`}>
          Kirim tautan atur kata sandi
        </button>
      </div>
    </form>
  );
}

/** Mode lokal (pnpm dev tanpa Supabase): kata sandi = DEV_AUTH_TOKEN di API */
function DevLogin({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await signIn('', password);
        router.replace(next);
      }}
    >
      <p className="rounded-tag bg-sunken p-3 text-[13px] text-muted">
        Mode pengembangan lokal. Kata sandi adalah nilai <code>DEV_AUTH_TOKEN</code> di <code>apps/api/.env</code> (bawaan <code>dev-owner</code>).
      </p>
      <div>
        <label htmlFor="password" className="text-[14px] font-semibold">
          Kata sandi
        </label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${inputCls}`} />
      </div>
      <button type="submit" className={`${btnPrimary} w-full`}>
        Masuk
      </button>
    </form>
  );
}

/** Supabase belum diatur dan mode pengembangan mati: jelaskan cara mengaktifkan login */
function NotConfigured() {
  return (
    <div className="mt-6 space-y-3 text-[14px] leading-relaxed">
      <p role="alert" className="font-semibold text-danger">
        Login panel belum diatur.
      </p>
      <p>Panel memakai akun Supabase (gratis). Langkahnya:</p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Di Supabase: <b>Authentication → Users → Add user → Create new user</b>. Isi email dan kata sandi, lalu centang{' '}
          <i>Auto Confirm User</i>.
        </li>
        <li>
          Di file <code>.env</code> (sebelah <code>docker-compose.yml</code>), isi <code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>, dan{' '}
          <code>OWNER_EMAIL</code> (email yang sama).
        </li>
        <li>
          Jalankan ulang: <code>docker compose up -d --build</code>, lalu buka kembali halaman ini.
        </li>
      </ol>
    </div>
  );
}

function LoginBody() {
  const params = useSearchParams();
  const next = params.get('lanjut')?.startsWith('/panel') ? params.get('lanjut')! : '/panel';
  const [devLogin, setDevLogin] = useState<boolean | null>(HAS_SUPABASE ? false : null);

  useEffect(() => {
    if (HAS_SUPABASE) return;
    fetch(`${API_URL}/api/health`)
      .then((r) => r.json())
      .then((d: { devLogin?: boolean }) => setDevLogin(Boolean(d.devLogin)))
      .catch(() => setDevLogin(false));
  }, []);

  if (HAS_SUPABASE) return <SupabaseLogin next={next} />;
  if (devLogin === null) return <p className="mt-6 text-muted">Memeriksa pengaturan login…</p>;
  return devLogin ? <DevLogin next={next} /> : <NotConfigured />;
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-8">
      <div className="w-full max-w-sm rounded-tag border border-line bg-surface p-6">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-3 text-[22px] font-bold">Masuk panel toko</h1>
        <p className="text-[14px] text-muted">Khusus pemilik dan pegawai Toko New Agung.</p>
        <Suspense>
          <LoginBody />
        </Suspense>
      </div>
    </div>
  );
}
