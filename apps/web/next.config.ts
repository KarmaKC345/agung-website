import path from 'node:path';
import type { NextConfig } from 'next';

// Alamat API yang dilihat browser. Kosong = origin yang sama (lewat rewrites di bawah).
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
// Alamat API yang dipakai server Next.js untuk meneruskan /api dan /uploads
const internalApiUrl = (process.env.API_INTERNAL_URL || publicApiUrl || 'http://localhost:4000').replace(/\/$/, '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function pattern(url: string, pathname: string) {
  const u = new URL(url);
  return {
    protocol: u.protocol.replace(':', '') as 'http' | 'https',
    hostname: u.hostname,
    port: u.port,
    pathname,
  };
}

const config: NextConfig = {
  transpilePackages: ['@newagung/shared'],
  poweredByHeader: false,
  // Docker memakai output standalone (image kecil, tanpa node_modules lengkap)
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  images: {
    formats: ['image/avif', 'image/webp'],
    // ponytail: di Vercel mode services, /_next/image 404 sehingga semua foto hilang.
    // Foto sudah .webp kecil, jadi disajikan langsung. Hapus bila optimizer Vercel sudah jalan.
    unoptimized: !!process.env.VERCEL,
    remotePatterns: [
      ...(publicApiUrl ? [pattern(publicApiUrl, '/uploads/**')] : []),
      ...(supabaseUrl ? [pattern(supabaseUrl, '/storage/v1/object/public/**')] : []),
    ],
    // hanya bila API sendiri berjalan di mesin lokal (pengembangan); di server sungguhan tetap diblokir
    dangerouslyAllowLocalIP: publicApiUrl ? ['localhost', '127.0.0.1'].includes(new URL(publicApiUrl).hostname) : false,
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Rute milik Next (mis. /api/revalidate) didahulukan; sisanya diteruskan ke Express API.
      fallback: [
        { source: '/api/:path*', destination: `${internalApiUrl}/api/:path*` },
        { source: '/uploads/:path*', destination: `${internalApiUrl}/uploads/:path*` },
      ],
    };
  },
};

export default config;
