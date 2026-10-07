import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
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
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      pattern(apiUrl, '/uploads/**'),
      ...(supabaseUrl ? [pattern(supabaseUrl, '/storage/v1/object/public/**')] : []),
    ],
    // hanya bila API sendiri berjalan di mesin lokal (pengembangan); di server sungguhan tetap diblokir
    dangerouslyAllowLocalIP: ['localhost', '127.0.0.1'].includes(new URL(apiUrl).hostname),
  },
};

export default config;
