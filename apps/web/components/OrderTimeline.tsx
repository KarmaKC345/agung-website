'use client';

import { Check, XCircle } from '@phosphor-icons/react';
import type { OrderStatus } from '@newagung/shared';

interface Props {
  status: OrderStatus;
  fulfilment?: 'ambil' | 'antar';
  className?: string;
}

const STEPS = [
  { id: 'baru', label: 'Pesanan Dibuat' },
  { id: 'disiapkan', label: 'Diproses Toko' },
  { id: 'siap', labelAntar: 'Siap Dikirim', labelAmbil: 'Siap Diambil' },
  { id: 'selesai', label: 'Selesai' },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  baru: 0,
  disiapkan: 1,
  siap: 2,
  selesai: 3,
  batal: -1,
};

/**
 * Visual Progress Stepper timeline pelacakan pesanan ala Tokopedia/Shopee.
 * ponytail: 4 tahap standar e-commerce; upgrade ke live webhook courier tracker jika Biteship dispatch aktif.
 */
export function OrderTimeline({ status, fulfilment = 'ambil', className = '' }: Props) {
  if (status === 'batal') {
    return (
      <div className={`flex items-center gap-2 rounded-tag border border-danger/30 bg-danger/10 px-3.5 py-2 text-[12px] font-medium text-danger ${className}`}>
        <XCircle size={16} weight="fill" className="shrink-0" />
        <span>Pesanan ini telah dibatalkan.</span>
      </div>
    );
  }

  const currentIdx = STATUS_INDEX[status] ?? 0;

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="relative flex items-center justify-between">
        {/* Connector Line Background */}
        <div className="absolute top-3.5 inset-x-4 h-0.5 -translate-y-1/2 bg-line" aria-hidden />

        {/* Active Filled Line */}
        <div
          className="absolute top-3.5 left-4 h-0.5 -translate-y-1/2 bg-brand transition-all duration-500 ease-out"
          style={{ width: `${(Math.max(0, currentIdx) / (STEPS.length - 1)) * 100}%` }}
          aria-hidden
        />

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          const label =
            step.id === 'siap'
              ? fulfilment === 'antar'
                ? step.labelAntar
                : step.labelAmbil
              : step.label;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Circle indicator */}
              <div
                className={`grid size-7 place-items-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-brand text-white shadow-xs'
                    : isCurrent
                      ? 'border-2 border-brand bg-surface text-brand ring-4 ring-brand/15 shadow-xs font-extrabold'
                      : 'border border-line bg-sunken text-muted'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? (
                  <Check size={14} weight="bold" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-1.5 max-w-[76px] text-center text-[11px] leading-tight transition-colors sm:max-w-none ${
                  isCurrent
                    ? 'font-bold text-ink'
                    : isDone
                      ? 'font-medium text-ink/80'
                      : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
