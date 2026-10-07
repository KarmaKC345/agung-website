'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  /** aksi yang menghapus/membatalkan: tombol merah, fokus awal di "Batal" */
  danger?: boolean;
}
interface PromptOptions {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel: string;
}

type Request =
  | ({ kind: 'confirm'; resolve: (v: boolean) => void } & ConfirmOptions)
  | ({ kind: 'prompt'; resolve: (v: string | null) => void } & PromptOptions);

interface DialogApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  prompt: (o: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogApi | null>(null);
export const useDialog = () => useContext(DialogContext)!;

/**
 * Dialog konfirmasi & isian untuk panel, pengganti confirm()/prompt() bawaan browser.
 * Memakai <dialog> asli (fokus terkunci, Esc menutup), permukaan putih datar,
 * bayangan popover, dan label tombol yang menyebut aksinya.
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [req, setReq] = useState<Request | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (req && d && !d.open) d.showModal();
  }, [req]);

  const close = useCallback(
    (ok: boolean) => {
      if (!req) return;
      if (req.kind === 'confirm') req.resolve(ok);
      else req.resolve(ok && value.trim() ? value.trim() : null);
      ref.current?.close();
      setReq(null);
    },
    [req, value],
  );

  const api: DialogApi = {
    confirm: (o) => new Promise((resolve) => setReq({ kind: 'confirm', resolve, ...o })),
    prompt: (o) =>
      new Promise((resolve) => {
        setValue(o.defaultValue ?? '');
        setReq({ kind: 'prompt', resolve, ...o });
      }),
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        className="m-auto w-[min(92vw,420px)] rounded-tag border border-line bg-surface p-0 text-ink shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)]"
      >
        {req && (
          <form
            className="p-5"
            onSubmit={(e) => {
              e.preventDefault();
              close(true);
            }}
          >
            <h2 id="dialog-title" className="text-[18px] font-bold">
              {req.title}
            </h2>
            {req.kind === 'confirm' && req.message && <p className="mt-2 text-[15px] leading-relaxed text-muted">{req.message}</p>}
            {req.kind === 'prompt' && (
              <label className="mt-3 block text-[14px] font-semibold">
                {req.label}
                <input
                  autoFocus
                  required
                  maxLength={160}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 h-11 w-full rounded-tag border border-field bg-surface px-3 text-[15px] font-normal"
                />
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                autoFocus={req.kind === 'confirm' && req.danger}
                onClick={() => close(false)}
                className="inline-flex h-11 items-center rounded-tag border border-field bg-surface px-4 text-[14px] font-semibold hover:border-ink"
              >
                Batal
              </button>
              <button
                type="submit"
                autoFocus={req.kind === 'confirm' && !req.danger}
                className={`inline-flex h-11 items-center rounded-tag px-4 text-[14px] font-semibold ${
                  req.kind === 'confirm' && req.danger ? 'bg-signal text-white' : 'bg-brand text-white'
                }`}
              >
                {req.confirmLabel}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </DialogContext.Provider>
  );
}
