'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { API_URL, HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

const DEV_TOKEN_KEY = 'newagung-dev-token';

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!HAS_SUPABASE) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'newagung-auth' },
  });
  return client;
}

export async function getToken(): Promise<string | null> {
  const sb = supabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  }
  try {
    return localStorage.getItem(DEV_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const sb = supabase();
  if (sb) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah' : error.message);
    return;
  }
  // mode lokal: kata sandi = DEV_AUTH_TOKEN di API
  localStorage.setItem(DEV_TOKEN_KEY, password);
}

export async function sendReset(email: string): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error('Reset kata sandi butuh Supabase');
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/panel/atur-sandi`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error('Butuh Supabase');
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const sb = supabase();
  if (sb) await sb.auth.signOut();
  localStorage.removeItem(DEV_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

export async function adminFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${API_URL}/api/admin${path}`, { ...init, headers, body });
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') ?? '';
  const data: unknown = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    const d = data as { error?: string; issues?: { path: string; message: string }[] };
    const detail = d?.issues?.length ? ` (${d.issues.map((i) => `${i.path}: ${i.message}`).join('; ')})` : '';
    throw new ApiError(res.status, `${d?.error ?? `Gagal (${res.status})`}${detail}`, data);
  }
  return data as T;
}

/** Unduh file dari endpoint panel (butuh token, jadi tidak bisa lewat <a href>) */
export async function adminDownload(path: string, filename: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${API_URL}/api/admin${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError(res.status, 'Gagal mengunduh');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Kecilkan foto di browser (maks 1600px, WebP) sebelum diunggah — hemat kuota HP pemilik */
export async function compressImage(file: File, maxSize = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto'))), 'image/webp', 0.82),
  );
}
