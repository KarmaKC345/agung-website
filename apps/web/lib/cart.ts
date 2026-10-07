'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Fulfilment } from '@newagung/shared';

export interface CartLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  unit: string;
  price: number;
  qty: number;
  image: string | null;
}

export interface PastOrder {
  code: string;
  createdAt: string;
  total: number;
  lines: CartLine[];
}

interface Customer {
  name: string;
  fulfilment: Fulfilment;
  pickupNote: string;
}

interface ShopState {
  lines: CartLine[];
  favorites: string[];
  history: PastOrder[];
  customer: Customer;
  add: (line: Omit<CartLine, 'qty'>, qty: number) => void;
  setQty: (variantId: string, unit: string, qty: number) => void;
  remove: (variantId: string, unit: string) => void;
  replaceLines: (lines: CartLine[]) => void;
  clear: () => void;
  toggleFavorite: (productId: string) => void;
  recordOrder: (order: PastOrder) => void;
  setCustomer: (c: Partial<Customer>) => void;
}

const same = (a: { variantId: string; unit: string }, variantId: string, unit: string) =>
  a.variantId === variantId && a.unit === unit;

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      lines: [],
      favorites: [],
      history: [],
      customer: { name: '', fulfilment: 'ambil', pickupNote: '' },
      add: (line, qty) =>
        set((s) => {
          const existing = s.lines.find((l) => same(l, line.variantId, line.unit));
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                same(l, line.variantId, line.unit) ? { ...l, ...line, qty: Math.min(9999, l.qty + qty) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty }] };
        }),
      setQty: (variantId, unit, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (same(l, variantId, unit) ? { ...l, qty: Math.max(1, Math.min(9999, qty)) } : l)),
        })),
      remove: (variantId, unit) => set((s) => ({ lines: s.lines.filter((l) => !same(l, variantId, unit)) })),
      replaceLines: (lines) => set({ lines }),
      clear: () => set({ lines: [] }),
      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((id) => id !== productId)
            : [productId, ...s.favorites].slice(0, 200),
        })),
      recordOrder: (order) => set((s) => ({ history: [order, ...s.history].slice(0, 30) })),
      setCustomer: (c) => set((s) => ({ customer: { ...s.customer, ...c } })),
    }),
    {
      name: 'newagung-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.length;
export const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.price * l.qty, 0);
