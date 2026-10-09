'use client';

import { create } from 'zustand';

interface ToastItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
}

interface ToastState {
  item: ToastItem | null;
  show: (item: Omit<ToastItem, 'id'>) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  item: null,
  show: (item) => {
    const id = Math.random().toString(36).slice(2);
    set({ item: { ...item, id } });
  },
  hide: () => set({ item: null }),
}));
