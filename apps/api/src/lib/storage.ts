import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../env';
import { HttpError } from '../errors';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/avif': 'avif',
};

export type StoreImage = (file: { buffer: Buffer; mimetype: string }) => Promise<string>;

/**
 * Simpan foto barang. Dengan Supabase: ke Storage (bucket publik) dan kembalikan URL publik.
 * Tanpa Supabase (lokal): ke folder ./uploads yang disajikan API di /uploads.
 */
export function createImageStore(env: Env): StoreImage {
  const supabase =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;

  return async ({ buffer, mimetype }) => {
    const ext = EXT[mimetype];
    if (!ext) throw new HttpError(415, 'Format foto harus WebP, JPEG, PNG, atau AVIF');
    const name = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;

    if (supabase) {
      const bucket = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET);
      const { error } = await bucket.upload(name, buffer, { contentType: mimetype, cacheControl: '31536000' });
      if (error) throw new HttpError(502, `Gagal mengunggah foto: ${error.message}`);
      return bucket.getPublicUrl(name).data.publicUrl;
    }

    const file = path.join(UPLOAD_DIR, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, buffer);
    return `${env.PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${name}`;
  };
}
