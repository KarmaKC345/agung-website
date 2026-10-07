import { createApp } from './app';
import { createPool } from './db';
import { loadEnv } from './env';

const env = loadEnv();
const db = createPool(env.DATABASE_URL);
const app = createApp({ db, env });

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
