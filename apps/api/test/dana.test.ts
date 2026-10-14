import { createHash, createSign, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env';
import { jakartaTime, mapDanaStatus, parseDanaNotify } from '../src/lib/dana';

// Tes tanpa jaringan: tanda tangan webhook DANA dibuat sendiri pakai pasangan kunci uji.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pub = publicKey.export({ type: 'spki', format: 'pem' }).toString();
// mode production agar SDK memakai kunci uji kita, bukan kunci sandbox bawaan DANA
process.env.DANA_ENV = 'production';
const env = loadEnv({ DATABASE_URL: 'x', DANA_ENV: 'production', DANA_PUBLIC_KEY: pub } as NodeJS.ProcessEnv);
const path = '/api/payments/dana/notify';

function signed(body: object) {
  const raw = JSON.stringify(body);
  const ts = '2026-10-12T10:00:00+07:00';
  const hash = createHash('sha256').update(raw).digest('hex');
  const sig = createSign('RSA-SHA256').update(`POST:${path}:${hash}:${ts}`).sign(privateKey, 'base64');
  return { raw, headers: { 'x-timestamp': ts, 'x-signature': sig } };
}

const notify = {
  originalPartnerReferenceNo: 'NA-261012-001',
  originalReferenceNo: 'DANA123',
  merchantId: 'M1',
  amount: { value: '15000.00', currency: 'IDR' },
  latestTransactionStatus: '00',
  createdTime: '2026-10-12T10:00:00+07:00',
  finishedTime: '2026-10-12T10:01:00+07:00',
};

describe('DANA', () => {
  it('maps transaction status', () => {
    expect(mapDanaStatus('00')).toBe('paid');
    expect(mapDanaStatus('01')).toBe('pending');
    expect(mapDanaStatus('02')).toBe('pending');
    expect(mapDanaStatus('05')).toBe('expired');
    expect(mapDanaStatus('07')).toBe('failed');
  });

  it('formats time in GMT+7', () => {
    expect(jakartaTime(new Date('2026-10-12T03:00:00Z'))).toBe('2026-10-12T10:00:00+07:00');
  });

  it('accepts a correctly signed notify', () => {
    const { raw, headers } = signed(notify);
    expect(parseDanaNotify(env, path, headers, raw)).toEqual({ code: 'NA-261012-001', ref: 'DANA123', status: 'paid' });
  });

  it('rejects a tampered notify', () => {
    const { headers } = signed(notify);
    const forged = JSON.stringify({ ...notify, amount: { value: '1.00', currency: 'IDR' } });
    expect(() => parseDanaNotify(env, path, headers, forged)).toThrow();
  });
});
