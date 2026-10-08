import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';
import { getStore } from '@/lib/api';

export const metadata: Metadata = { title: 'Keranjang', robots: { index: false } };

export default async function CartPage() {
  const store = await getStore();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      <h1 className="mb-5 text-[26px] font-bold">Keranjang</h1>
      <CartView hours={store.openingHours} timezone={store.timezone} />
    </div>
  );
}
