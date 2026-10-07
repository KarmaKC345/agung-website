import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';

export const metadata: Metadata = { title: 'Keranjang', robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <h1 className="mb-5 text-[26px] font-bold">Keranjang</h1>
      <CartView />
    </div>
  );
}
