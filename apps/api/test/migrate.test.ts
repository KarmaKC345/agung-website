import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPool } from '../src/db';
import { migrate } from '../src/migrate';

const root = path.resolve(__dirname, '../../..');
const dir = path.join(root, 'supabase');
const ADMIN = process.env.TEST_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
const URL = ADMIN.replace(/\/[^/]*$/, '/newagung_migrate_test');

function recreate() {
  execFileSync('psql', [ADMIN, '-q', '-c', 'drop database if exists newagung_migrate_test with (force)', '-c', 'create database newagung_migrate_test'], {
    stdio: 'ignore',
  });
}

describe('migrasi otomatis', () => {
  it('database baru: menjalankan semua migrasi lalu seed, dan aman dijalankan ulang', async () => {
    recreate();
    const db = createPool(URL);
    const first = await migrate(db, dir, { seed: true });
    expect(first.applied).toContain('20261007000000_init.sql');
    expect(first.applied).toContain('20261008000000_marketplace.sql');
    expect(first.seeded).toBe(true);
    const { rows } = await db.query('select count(*)::int as n from products');
    expect(rows[0].n).toBeGreaterThan(0);
    const again = await migrate(db, dir, { seed: true });
    expect(again).toEqual({ applied: [], seeded: false });
    await db.end();
  });

  it('database lama (dibuat skrip init Docker v1): migrasi awal tidak diulang, migrasi baru dijalankan', async () => {
    recreate();
    for (const f of ['20261007000000_init.sql', '20261007000100_storage.sql']) {
      execFileSync('psql', [URL, '-q', '-v', 'ON_ERROR_STOP=1', '-f', path.join(dir, 'migrations', f)], { stdio: 'ignore' });
    }
    const db = createPool(URL);
    const res = await migrate(db, dir, { seed: true });
    expect(res.applied).toEqual(['20261008000000_marketplace.sql']);
    expect(res.seeded).toBe(false);
    const { rows } = await db.query(`select count(*)::int as n from promo_banners`);
    expect(rows[0].n).toBe(3);
    await db.end();
  });
});
