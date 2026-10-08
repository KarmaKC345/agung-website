import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Supabase tiruan: perilaku inviteUserByEmail / generateLink diatur per tes
const supa = vi.hoisted(() => ({ invite: vi.fn(), generateLink: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: { inviteUserByEmail: supa.invite, generateLink: supa.generateLink } } }),
}));

import { createApp } from '../src/app';
import { createPool, type Db } from '../src/db';
import { loadEnv } from '../src/env';

const ADMIN = process.env.TEST_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
const URL = ADMIN.replace(/\/[^/]*$/, '/newagung_staff_test');
const root = path.resolve(__dirname, '../../..');
const SUPABASE_URL = 'https://contoh.supabase.co';
const SECRET = 'rahasia-tes-yang-cukup-panjang-untuk-hs256';
const OWNER_ID = '11111111-1111-4111-8111-111111111111';

let db: Db;
let app: ReturnType<typeof createApp>;
let auth: { Authorization: string };

beforeAll(async () => {
  execFileSync('bash', [path.join(root, 'supabase/local/reset.sh')], { env: { ...process.env, DATABASE_URL: URL }, stdio: 'ignore' });
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: URL,
    SUPABASE_URL,
    SUPABASE_JWT_SECRET: SECRET,
    SUPABASE_SERVICE_ROLE_KEY: 'kunci-layanan',
    OWNER_EMAIL: 'pemilik@contoh.id',
    SITE_URL: 'https://newagung.com',
  } as NodeJS.ProcessEnv);
  db = createPool(URL);
  app = createApp({ db, env, revalidate: () => {}, storeImage: async () => '' });
  const token = await new SignJWT({ email: 'pemilik@contoh.id' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(OWNER_ID)
    .setIssuer(`${SUPABASE_URL}/auth/v1`)
    .setAudience('authenticated')
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(SECRET));
  auth = { Authorization: `Bearer ${token}` };
});

afterAll(async () => {
  await db?.end();
});

beforeEach(() => {
  supa.invite.mockReset();
  supa.generateLink.mockReset();
});

describe('undang pegawai', () => {
  it('mengirim email undangan seperti biasa', async () => {
    supa.invite.mockResolvedValue({ data: { user: { id: '22222222-2222-4222-8222-222222222222' } }, error: null });
    const res = await request(app).post('/api/admin/staff').set(auth).send({ email: 'budi@contoh.id', role: 'staff' }).expect(201);
    expect(res.body.inviteLink).toBeNull();
    expect(supa.invite).toHaveBeenCalledWith('budi@contoh.id', { redirectTo: 'https://newagung.com/panel/atur-sandi' });
    expect(supa.generateLink).not.toHaveBeenCalled();
  });

  it('memberi tautan undangan bila batas email Supabase tercapai', async () => {
    supa.invite.mockResolvedValue({ data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } });
    supa.generateLink.mockResolvedValue({
      data: { user: { id: '33333333-3333-4333-8333-333333333333' }, properties: { action_link: 'https://contoh.supabase.co/auth/v1/verify?token=abc&type=invite' } },
      error: null,
    });
    const res = await request(app).post('/api/admin/staff').set(auth).send({ email: 'Sari@Contoh.id', role: 'staff' }).expect(201);
    expect(res.body.inviteLink).toBe('https://contoh.supabase.co/auth/v1/verify?token=abc&type=invite');
    expect(supa.generateLink).toHaveBeenCalledWith({ type: 'invite', email: 'Sari@Contoh.id', options: { redirectTo: 'https://newagung.com/panel/atur-sandi' } });
    const list = (await request(app).get('/api/admin/staff').set(auth).expect(200)).body;
    expect(list.map((s: { email: string }) => s.email)).toContain('sari@contoh.id');
  });

  it('memberi tautan atur kata sandi untuk akun yang sudah pernah diundang', async () => {
    supa.invite.mockResolvedValue({ data: { user: null }, error: { status: 422, message: 'A user with this email address has already been registered' } });
    supa.generateLink.mockResolvedValue({
      data: { user: { id: '33333333-3333-4333-8333-333333333333' }, properties: { action_link: 'https://contoh.supabase.co/auth/v1/verify?token=def&type=recovery' } },
      error: null,
    });
    const res = await request(app).post('/api/admin/staff').set(auth).send({ email: 'sari@contoh.id', role: 'owner' }).expect(201);
    expect(supa.generateLink.mock.calls[0]![0].type).toBe('recovery');
    expect(res.body.inviteLink).toContain('type=recovery');
    const { rows } = await db.query('select role from staff where user_id = $1', ['33333333-3333-4333-8333-333333333333']);
    expect(rows[0].role).toBe('owner');
  });

  it('meneruskan galat lain dari Supabase', async () => {
    supa.invite.mockResolvedValue({ data: { user: null }, error: { status: 400, message: 'Unable to validate email address: invalid format' } });
    const res = await request(app).post('/api/admin/staff').set(auth).send({ email: 'x@contoh.id', role: 'staff' }).expect(502);
    expect(res.body.error).toContain('Undangan belum berhasil dikirim');
    expect(supa.generateLink).not.toHaveBeenCalled();
  });
});
