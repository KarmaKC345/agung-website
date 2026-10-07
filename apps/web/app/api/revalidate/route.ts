import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

/** Dipanggil Express API setelah data barang/harga/toko berubah */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === 'string' && t.length > 0 && t.length <= 256) : [];
  // expire: 0 → harga baru langsung tampil di kunjungan berikutnya, bukan versi lama dulu
  for (const tag of tags.slice(0, 50)) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags.length });
}
