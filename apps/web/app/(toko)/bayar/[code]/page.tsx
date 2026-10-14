import type { Metadata } from 'next';
import { PaymentStatusView } from '@/components/PaymentStatusView';

export const metadata: Metadata = { title: 'Status pembayaran', robots: { index: false } };

export default async function PaymentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-16">
      <PaymentStatusView code={decodeURIComponent(code)} />
    </div>
  );
}
