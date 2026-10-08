import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from 'pino';
import type { Db } from './db';

/**
 * Menjalankan migrasi SQL yang belum pernah dijalankan (supabase/migrations/*.sql),
 * berurutan, masing-masing dalam satu transaksi. Dicatat di tabel schema_migrations.
 *
 * - Database baru (belum ada tabel products): semua migrasi dijalankan, lalu seed.sql.
 * - Database lama yang dibuat oleh skrip init Docker versi pertama (tabel sudah ada
 *   tapi schema_migrations belum ada): dua migrasi awal dianggap sudah jalan.
 */
const BASELINE = ['20261007000000_init.sql', '20261007000100_storage.sql'];

export interface MigrateResult {
  applied: string[];
  seeded: boolean;
}

export async function migrate(db: Db, dir: string, opts: { seed: boolean; log?: Logger }): Promise<MigrateResult> {
  const client = await db.connect();
  try {
    // satu instance API saja yang bermigrasi pada satu waktu
    await client.query(`select pg_advisory_lock(hashtext('newagung_migrate'))`);

    const { rows: tableRows } = await client.query<{ has_products: boolean; has_log: boolean }>(
      `select to_regclass('public.products') is not null as has_products,
              to_regclass('public.schema_migrations') is not null as has_log`,
    );
    const { has_products: hadProducts, has_log: hadLog } = tableRows[0]!;

    await client.query(
      `create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`,
    );
    await client.query('alter table schema_migrations enable row level security');
    if (hadProducts && !hadLog) {
      await client.query(`insert into schema_migrations (name) select unnest($1::text[]) on conflict do nothing`, [BASELINE]);
      opts.log?.info({ baseline: BASELINE }, 'database lama: migrasi awal ditandai sudah jalan');
    }

    const { rows: done } = await client.query<{ name: string }>('select name from schema_migrations');
    const doneSet = new Set(done.map((r) => r.name));
    const files = (await readdir(path.join(dir, 'migrations'))).filter((f) => f.endsWith('.sql')).sort();

    const applied: string[] = [];
    for (const file of files) {
      if (doneSet.has(file)) continue;
      const sql = await readFile(path.join(dir, 'migrations', file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw new Error(`Migrasi ${file} gagal: ${(err as Error).message}`);
      }
      applied.push(file);
      opts.log?.info({ file }, 'migrasi dijalankan');
    }

    let seeded = false;
    if (!hadProducts && opts.seed) {
      const seed = await readFile(path.join(dir, 'seed.sql'), 'utf8');
      await client.query('begin');
      try {
        await client.query(seed);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw new Error(`Seed gagal: ${(err as Error).message}`);
      }
      seeded = true;
      opts.log?.info('database baru: data awal (seed.sql) dimasukkan');
    }

    return { applied, seeded };
  } finally {
    await client.query(`select pg_advisory_unlock(hashtext('newagung_migrate'))`).catch(() => {});
    client.release();
  }
}
