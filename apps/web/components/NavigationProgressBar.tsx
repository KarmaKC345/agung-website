'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;
      if (target.target && target.target !== '_self') return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      try {
        const targetUrl = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          setLoading(true);
        }
      } catch {
        // abaikan URL tidak valid
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden bg-brand/10">
      <div className="h-full w-full bg-brand origin-left animate-[navProgress_1.2s_ease-in-out_infinite]" />
    </div>
  );
}
