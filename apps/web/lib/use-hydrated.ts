'use client';

import { useEffect, useState } from 'react';
import { useShop } from './cart';

let started = false;

/**
 * Data keranjang/favorit tersimpan di localStorage (hanya ada di browser). Supaya HTML
 * server dan klien sama saat pertama dirender, komponen menunggu data perangkat dimuat.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const p = useShop.persist;
    if (p.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = p.onFinishHydration(() => setHydrated(true));
    if (!started) {
      started = true;
      void p.rehydrate();
    }
    return unsub;
  }, []);
  return hydrated;
}
