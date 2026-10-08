import type { RequestHandler } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { StaffRole } from '@newagung/shared';
import type { Db } from './db';
import type { Env } from './env';
import { HttpError } from './errors';

export interface StaffUser {
  userId: string;
  email: string;
  role: StaffRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: StaffUser;
    }
  }
}

export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

type Verify = (token: string) => Promise<JWTPayload>;

function createVerifier(env: Env): Verify | null {
  if (!env.SUPABASE_URL) return null;
  const issuer = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;
  if (env.SUPABASE_JWT_SECRET) {
    const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    return async (token) => (await jwtVerify(token, secret, { issuer, audience: 'authenticated' })).payload;
  }
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  return async (token) => (await jwtVerify(token, jwks, { issuer, audience: 'authenticated' })).payload;
}

export function createAuth(env: Env, db: Db): RequestHandler {
  const verify = createVerifier(env);

  return async (req, _res, next) => {
    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new HttpError(401, 'Silakan masuk terlebih dahulu.');

    if (env.DEV_AUTH_TOKEN && token === env.DEV_AUTH_TOKEN) {
      req.staff = { userId: DEV_USER_ID, email: 'dev@localhost', role: 'owner' };
      return next();
    }
    if (!verify) throw new HttpError(401, 'Login belum dikonfigurasi (SUPABASE_URL kosong)');

    let payload: JWTPayload;
    try {
      payload = await verify(token);
    } catch {
      throw new HttpError(401, 'Sesi Anda telah berakhir. Silakan masuk kembali.');
    }
    const userId = payload.sub;
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (!userId) throw new HttpError(401, 'Sesi tidak valid. Silakan masuk kembali.');

    let { rows } = await db.query<{ role: StaffRole; active: boolean }>(
      'select role, active from staff where user_id = $1',
      [userId],
    );

    // Pemilik pertama: akun dengan OWNER_EMAIL otomatis menjadi owner selama belum ada owner.
    if (!rows.length && env.OWNER_EMAIL && email === env.OWNER_EMAIL.toLowerCase()) {
      ({ rows } = await db.query<{ role: StaffRole; active: boolean }>(
        `insert into staff (user_id, email, role)
         select $1, $2, 'owner' where not exists (select 1 from staff where role = 'owner')
         returning role, active`,
        [userId, email],
      ));
    }

    const staff = rows[0];
    if (!staff || !staff.active) throw new HttpError(403, 'Akun ini tidak memiliki akses ke panel toko.');
    req.staff = { userId, email, role: staff.role };
    next();
  };
}

export const ownerOnly: RequestHandler = (req, _res, next) => {
  if (req.staff?.role !== 'owner') throw new HttpError(403, 'Hanya pemilik toko yang dapat melakukan tindakan ini.');
  next();
};
