import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // ponytail: .mjs agar Vercel tetap jalankan sebagai ESM (package.json root tidak ikut dibundel ke /var/task)
  outExtension: () => ({ js: '.mjs' }),
  // paket workspace ditulis dalam TS, jadi dibundel ke dalam dist
  noExternal: ['@newagung/shared'],
});
