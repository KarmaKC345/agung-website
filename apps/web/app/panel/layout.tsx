import type { Metadata } from 'next';
import { PanelShell } from '@/components/panel/PanelShell';

export const metadata: Metadata = { title: 'Panel toko', robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
