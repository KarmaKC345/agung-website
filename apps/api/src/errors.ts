import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Data') => new HttpError(404, `${what} tidak ditemukan`);

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Data yang dikirim belum lengkap atau tidak sesuai',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  const code = (err as { code?: string }).code;
  if (code === '23505') {
    res.status(409).json({ error: 'Data dengan nama yang sama sudah ada' });
    return;
  }
  if (code === '23503') {
    res.status(409).json({ error: 'Data ini masih digunakan oleh data lain, sehingga tidak dapat dihapus' });
    return;
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Ukuran data terlalu besar' });
    return;
  }
  req.log?.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Maaf, terjadi kesalahan pada server. Silakan coba beberapa saat lagi.' });
};
