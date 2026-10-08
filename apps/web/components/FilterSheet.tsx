'use client';

import { Funnel, X } from '@phosphor-icons/react';
import { useRef } from 'react';

/**
 * Panel filter untuk HP: lembar dari bawah memakai <dialog> asli (fokus terkunci, Esc
 * menutup). Isi filter dirender di server dan dikirim sebagai children; panel tertutup
 * sendiri saat sebuah filter dipilih.
 */
export function FilterSheet({ count, total, children }: { count: number; total: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn btn-secondary h-9 min-h-0 shrink-0 px-3 text-[14px]">
        <Funnel size={16} weight="bold" aria-hidden />
        Filter
        {count > 0 && <span className="price grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">{count}</span>}
      </button>
      <dialog
        ref={ref}
        aria-label="Filter produk"
        onClick={(e) => {
          // klik latar gelap, tautan filter, atau kirim form harga → tutup
          if (e.target === ref.current || (e.target as HTMLElement).closest('a')) close();
        }}
        onSubmit={close}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[var(--radius-media)] border-0 bg-surface p-0 text-ink"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-2">
          <p className="text-[16px] font-bold">Filter</p>
          <button type="button" onClick={close} className="tap grid size-10 place-items-center rounded-full hover:bg-sunken" aria-label="Tutup filter">
            <X size={20} weight="bold" aria-hidden />
          </button>
        </div>
        <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">{children}</div>
        <div className="sticky bottom-0 border-t border-line bg-surface px-4 py-3">
          <button type="button" onClick={close} className="btn btn-primary w-full">
            Tampilkan {total} produk
          </button>
        </div>
      </dialog>
    </>
  );
}
