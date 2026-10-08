import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SavedView } from '@/components/SavedView';

export const metadata: Metadata = { title: 'Favorit & riwayat pesanan', robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <h1 className="mb-4 text-[26px] font-bold">Favorit & riwayat pesanan</h1>
      <Suspense>
        <SavedView />
      </Suspense>
    </div>
  );
}
