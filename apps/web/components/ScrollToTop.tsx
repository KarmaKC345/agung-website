'use client';

import { ArrowUp } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 450);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className="tap fixed bottom-20 right-4 z-30 grid size-10 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
    >
      <ArrowUp size={18} weight="bold" aria-hidden />
    </button>
  );
}
