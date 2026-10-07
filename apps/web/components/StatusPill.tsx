'use client';

import { useEffect, useState } from 'react';
import { getOpenStatus, type OpenStatus, type WeeklyHours } from '@newagung/shared';

/** Status buka dihitung di perangkat (WITA), supaya tetap benar walau halaman dari cache */
export function StatusPill({ hours, timezone, className = '' }: { hours: WeeklyHours; timezone: string; className?: string }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(getOpenStatus(hours, timezone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours, timezone]);

  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap ${className}`}>
      <span
        aria-hidden
        className={`size-2 rounded-full ${status === null ? 'bg-line-strong' : status.isOpen ? 'bg-ok' : 'bg-danger'}`}
      />
      <span className={status === null ? 'opacity-0' : ''}>{status?.label ?? 'Buka · tutup 22.00'}</span>
    </span>
  );
}
