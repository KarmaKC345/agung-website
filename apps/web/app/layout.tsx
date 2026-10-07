import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'New Agung | Toko Alat Tulis & Kantor, Makassar',
    template: '%s · New Agung Makassar',
  },
  description:
    'Cek harga alat tulis, kertas, map, kalkulator, dan tinta di Toko New Agung, Jl. DR. Ratulangi No.52 Makassar. Pesan lewat WhatsApp, ambil di toko. Buka setiap hari 05.00-22.00.',
  openGraph: { type: 'website', locale: 'id_ID', siteName: 'New Agung', images: ['/foto/lorong-kertas.webp'] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171a31' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
