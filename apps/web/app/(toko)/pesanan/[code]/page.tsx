import type { Metadata } from 'next';
import { OrderDetailView } from '@/components/OrderDetailView';

export const metadata: Metadata = {
  title: 'Rincian Pesanan',
  robots: { index: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16">
      <OrderDetailView code={decodeURIComponent(code)} />
    </div>
  );
}
