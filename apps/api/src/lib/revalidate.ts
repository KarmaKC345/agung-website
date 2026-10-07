import type { Logger } from 'pino';
import type { Env } from '../env';

export type Revalidate = (tags: string[]) => void;

/**
 * Minta Next.js membuang cache halaman terkait. Dijalankan di latar belakang:
 * kegagalan revalidasi tidak boleh menggagalkan penyimpanan data.
 */
export function createRevalidator(env: Env, log: Logger): Revalidate {
  if (!env.WEB_URL || !env.REVALIDATE_SECRET) {
    return () => {};
  }
  return (tags) => {
    fetch(`${env.WEB_URL.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => {
        if (!res.ok) log.warn({ status: res.status, tags }, 'revalidate failed');
      })
      .catch((err: unknown) => log.warn({ err, tags }, 'revalidate failed'));
  };
}
