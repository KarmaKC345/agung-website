'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { StaffRole } from '@newagung/shared';
import { adminFetch, ApiError, signOut } from '@/lib/admin';
import { LogoMark } from '../Logo';

interface Me {
  userId: string;
  email: string;
  role: StaffRole;
}

const MeContext = createContext<Me | null>(null);
export const useMe = () => useContext(MeContext)!;

const NAV: { href: string; label: string; owner?: boolean }[] = [
  { href: '/panel', label: 'Pesanan masuk' },
  { href: '/panel/barang', label: 'Barang' },
  { href: '/panel/harga', label: 'Ubah harga' },
  { href: '/panel/kategori', label: 'Kategori & merek' },
  { href: '/panel/import', label: 'Import / export' },
  { href: '/panel/toko', label: 'Info toko', owner: true },
  { href: '/panel/pegawai', label: 'Pegawai', owner: true },
];

const PUBLIC = ['/panel/masuk', '/panel/atur-sandi'];

export function PanelShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPublic = PUBLIC.includes(path);

  useEffect(() => {
    if (isPublic) return;
    adminFetch<Me>('/me')
      .then(setMe)
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) router.replace(`/panel/masuk?lanjut=${encodeURIComponent(path)}`);
        else setError(e instanceof Error ? e.message : 'Gagal memuat panel');
      });
  }, [isPublic, path, router]);

  if (isPublic) return <>{children}</>;
  if (error) {
    return (
      <div className="mx-auto max-w-md p-8">
        <p className="font-semibold text-danger">{error}</p>
        <button
          className="mt-4 h-10 rounded-tag border border-line-strong px-4 font-semibold"
          onClick={async () => {
            await signOut();
            router.replace('/panel/masuk');
          }}
        >
          Masuk dengan akun lain
        </button>
      </div>
    );
  }
  if (!me) return <div className="p-8 text-muted">Memuat panel…</div>;

  const isActive = (href: string) => (href === '/panel' ? path === '/panel' : path.startsWith(href));
  const nav = NAV.filter((n) => !n.owner || me.role === 'owner');

  return (
    <MeContext.Provider value={me}>
      <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
        <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-dvh md:border-r md:border-b-0">
          <div className="flex items-center gap-2 px-4 py-3">
            <LogoMark className="h-7 w-7" />
            <span className="font-bold">Panel toko</span>
            <Link href="/" className="ml-auto text-[13px] text-muted hover:text-ink md:hidden">
              Lihat website
            </Link>
          </div>
          <nav className="scrollbar-none overflow-x-auto md:overflow-visible">
            <ul className="flex gap-1 px-2 pb-2 md:flex-col md:px-2">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? 'page' : undefined}
                    className="block rounded-tag px-3 py-2 text-[14px] font-medium whitespace-nowrap text-muted hover:bg-sunken hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-surface"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden px-4 py-4 text-[13px] text-muted md:absolute md:bottom-0 md:block">
            <p className="truncate">{me.email}</p>
            <p className="capitalize">{me.role === 'owner' ? 'Pemilik' : 'Pegawai'}</p>
            <div className="mt-2 flex gap-3">
              <Link href="/" className="hover:text-ink">
                Lihat website
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.replace('/panel/masuk');
                }}
                className="hover:text-ink"
              >
                Keluar
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
      </div>
    </MeContext.Provider>
  );
}

export function PageTitle({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[24px] font-bold">{children}</h1>
      {actions}
    </div>
  );
}

export const inputCls = 'h-10 w-full rounded-tag border border-line-strong bg-surface px-3 text-[15px]';
export const btnPrimary = 'inline-flex h-10 items-center justify-center rounded-tag bg-ink px-4 text-[14px] font-semibold text-surface disabled:opacity-50';
export const btnSecondary =
  'inline-flex h-10 items-center justify-center rounded-tag border border-line-strong bg-surface px-4 text-[14px] font-semibold hover:border-ink disabled:opacity-50';
