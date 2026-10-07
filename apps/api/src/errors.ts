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
      error: 'Data tidak valid',
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
    res.status(409).json({ error: 'Data sudah ada (slug/nama duplikat)' });
    return;
  }
  if (code === '23503') {
    res.status(409).json({ error: 'Data masih dipakai oleh data lain' });
    return;
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Data terlalu besar' });
    return;
  }
  req.log?.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Terjadi kesalahan di server' });
};
