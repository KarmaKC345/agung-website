'use client';

import { Check, ShareNetwork } from '@phosphor-icons/react';
import { useState } from 'react';
import { useToast } from '@/lib/toast';

export function ShareButton({ title, className = '' }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Abaikan bila pengguna membatalkan
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      useToast.getState().show({
        title: 'Tautan produk disalin',
        description: 'Tautan siap ditempel ke chat atau media sosial',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan bila clipboard diblokir
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Bagikan produk ini"
      title="Bagikan produk"
      className={`tap grid size-10 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95 ${className}`}
    >
      {copied ? (
        <Check size={18} weight="bold" className="text-ok" aria-hidden />
      ) : (
        <ShareNetwork size={18} weight="bold" aria-hidden />
      )}
    </button>
  );
}
