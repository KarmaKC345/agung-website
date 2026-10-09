'use client';

import { create } from 'zustand';

export interface ToastInput {
  title: string;
  description?: string;
  cart?: {
    qty: number;
    unit: string;
  };
}

export interface ToastItem extends ToastInput {
  id: string;
}

interface ToastState {
  item: ToastItem | null;
  show: (input: ToastInput) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  item: null,
  show: (input) => {
    const id = Math.random().toString(36).slice(2);
    set({ item: { ...input, id } });
  },
  hide: () => set({ item: null }),
}));
