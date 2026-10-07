import pg from 'pg';

// int8 (count, bigint) → number. Aman untuk ukuran data toko.
pg.types.setTypeParser(20, (v) => Number(v));

export type Db = pg.Pool;
export type DbClient = pg.PoolClient;
export type Queryable = Pick<pg.Pool, 'query'>;

export function createPool(connectionString: string): Db {
  const ssl = /supabase\.(co|com)/.test(connectionString) ? { rejectUnauthorized: false } : undefined;
  return new pg.Pool({ connectionString, ssl, max: 10 });
}

/** Jalankan fn dalam transaksi. userId dicatat untuk riwayat harga. */
export async function withTx<T>(db: Db, fn: (c: DbClient) => Promise<T>, userId?: string): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('begin');
    if (userId) {
      await client.query(`select set_config('app.user_id', $1, true)`, [userId]);
    }
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
