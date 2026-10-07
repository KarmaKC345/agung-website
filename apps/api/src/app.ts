import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pino, { type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { Db } from './db';
import type { Env } from './env';
import { errorHandler } from './errors';
import { createRevalidator, type Revalidate } from './lib/revalidate';
import { createImageStore, UPLOAD_DIR, type StoreImage } from './lib/storage';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';

export interface Ctx {
  db: Db;
  env: Env;
  log: Logger;
  revalidate: Revalidate;
  storeImage: StoreImage;
}

export function createApp(opts: { db: Db; env: Env; log?: Logger; revalidate?: Revalidate; storeImage?: StoreImage }) {
  const log = opts.log ?? pino({ level: opts.env.NODE_ENV === 'test' ? 'silent' : 'info' });
  const ctx: Ctx = {
    db: opts.db,
    env: opts.env,
    log,
    revalidate: opts.revalidate ?? createRevalidator(opts.env, log),
    storeImage: opts.storeImage ?? createImageStore(opts.env),
  };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: opts.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '200kb' }));
  app.use(pinoHttp({ logger: log, autoLogging: opts.env.NODE_ENV !== 'test' }));

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));
  app.use('/api', publicRoutes(ctx));
  app.use('/api/admin', adminRoutes(ctx));
  app.use((_req, res) => {
    res.status(404).json({ error: 'Tidak ditemukan' });
  });
  app.use(errorHandler);

  return app;
}
