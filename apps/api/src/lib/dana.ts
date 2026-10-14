import { Dana } from 'dana-node';
import { WebhookParser } from 'dana-node/webhook/v1';
import type { Env } from '../env';
import { HttpError } from '../errors';

export type PaymentStatus = 'none' | 'pending' | 'paid' | 'failed' | 'expired';

/** latestTransactionStatus DANA: 00 lunas, 01/02 menunggu, 05 batal, 07 tidak ada */
export function mapDanaStatus(code: string | undefined): PaymentStatus {
  if (code === '00') return 'paid';
  if (code === '05') return 'expired';
  if (code === '07') return 'failed';
  return 'pending';
}

export function danaEnabled(env: Env): boolean {
  return Boolean(env.DANA_PARTNER_ID && env.DANA_MERCHANT_ID && env.DANA_PRIVATE_KEY);
}

let client: Dana | null = null;
function dana(env: Env): Dana {
  if (!danaEnabled(env)) throw new HttpError(503, 'Pembayaran DANA belum diaktifkan oleh toko');
  // SDK membaca process.env.DANA_ENV untuk validasi & kunci webhook; samakan dengan env kita
  process.env.DANA_ENV ??= env.DANA_ENV;
  client ??= new Dana({
    partnerId: env.DANA_PARTNER_ID,
    privateKey: env.DANA_PRIVATE_KEY.replace(/\\n/g, '\n'),
    origin: env.DANA_ORIGIN,
    env: env.DANA_ENV,
  });
  return client;
}

/** 'YYYY-MM-DDTHH:mm:ss+07:00' (DANA wajib GMT+7) */
export function jakartaTime(d: Date): string {
  const t = new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 19);
  return `${t}+07:00`;
}

export async function createDanaPayment(
  env: Env,
  o: { code: string; total: number; items: { name: string; qty: number; price: number }[] },
): Promise<{ payUrl: string; ref: string | null }> {
  const site = (env.SITE_URL || env.WEB_URL).replace(/\/$/, '');
  const api = env.PUBLIC_API_URL.replace(/\/$/, '');
  const res = await dana(env).paymentGatewayApi.createOrder({
    partnerReferenceNo: o.code,
    merchantId: env.DANA_MERCHANT_ID,
    amount: { value: o.total.toFixed(2), currency: 'IDR' },
    // sandbox menolak validUpTo > 30 menit
    validUpTo: jakartaTime(new Date(Date.now() + 25 * 60_000)),
    urlParams: [
      { url: `${site}/bayar/${o.code}`, type: 'PAY_RETURN', isDeeplink: 'N' },
      { url: `${api}/api/payments/dana/notify`, type: 'NOTIFICATION', isDeeplink: 'N' },
    ],
    additionalInfo: {
      mcc: '5943', // toko alat tulis
      envInfo: { sourcePlatform: 'IPG', terminalType: 'WEB' },
      order: { orderTitle: `Pesanan ${o.code}`, scenario: 'REDIRECT' },
    },
  });
  if (!res.webRedirectUrl) throw new HttpError(502, `DANA menolak pembayaran: ${res.responseMessage}`);
  return { payUrl: res.webRedirectUrl, ref: res.referenceNo ?? null };
}

export async function queryDanaPayment(env: Env, code: string): Promise<PaymentStatus> {
  const res = await dana(env).paymentGatewayApi.queryPayment({
    originalPartnerReferenceNo: code,
    serviceCode: '54',
    merchantId: env.DANA_MERCHANT_ID,
  });
  return mapDanaStatus(res.latestTransactionStatus);
}

/** Verifikasi tanda tangan webhook DANA; lempar error bila palsu */
export function parseDanaNotify(env: Env, path: string, headers: Record<string, string>, rawBody: string) {
  // sandbox: SDK memakai public key sandbox DANA bawaan (DANA_PUBLIC_KEY diabaikan)
  process.env.DANA_ENV ??= env.DANA_ENV;
  if (env.DANA_ENV === 'production' && !env.DANA_PUBLIC_KEY) throw new HttpError(503, 'DANA_PUBLIC_KEY belum diatur');
  const n = new WebhookParser(env.DANA_PUBLIC_KEY.replace(/\\n/g, '\n') || undefined).parseWebhook('POST', path, headers, rawBody);
  return { code: n.originalPartnerReferenceNo, ref: n.originalReferenceNo, status: mapDanaStatus(n.latestTransactionStatus) };
}
