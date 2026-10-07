const PUBLIC_API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/**
 * Alamat API untuk browser. Kosong = origin yang sama: Next.js meneruskan /api/* dan
 * /uploads/* ke API (lihat rewrites di next.config.ts). Ini cara yang dipakai di Docker.
 */
export const API_URL = PUBLIC_API;

/** Alamat API untuk server Next.js (di Docker: http://api:4000 lewat jaringan internal) */
export const SERVER_API_URL = (process.env.API_INTERNAL_URL || PUBLIC_API || 'http://localhost:4000').replace(/\/$/, '');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
