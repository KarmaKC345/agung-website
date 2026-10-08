import path from 'node:path';
import pino from 'pino';
import { createApp } from './app';
import { createPool } from './db';
import { loadEnv } from './env';
import { migrate } from './migrate';

const env = loadEnv();
const log = pino({ level: 'info' });
const db = createPool(env.DATABASE_URL);

if (env.AUTO_MIGRATE) {
  const dir = env.SUPABASE_DIR || path.resolve(process.cwd(), '../../supabase');
  try {
    const result = await migrate(db, dir, { seed: env.AUTO_SEED, log });
    log.info({ applied: result.applied, seeded: result.seeded }, 'database siap');
  } catch (err) {
    log.error({ err }, 'migrasi database gagal');
    process.exit(1);
  }
}

const app = createApp({ db, env, log });

const server = app.listen(env.PORT, () => {
  console.log(`API Toko New Agung jalan di http://localhost:${env.PORT}`);
  if (env.DEV_AUTH_TOKEN) console.log('Mode login pengembangan aktif (DEV_AUTH_TOKEN).');
});

function shutdown() {
  server.close(() => {
    void db.end().then(() => process.exit(0));
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
