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
  // ponytail: semua dependency dibundel ke 1 file. Vercel menaruh index.mjs di /var/task,
  // sedangkan node_modules di /var/task/apps/api, jadi import paket tidak ketemu.
  noExternal: [/.*/],
  // paket CJS (express dll) memanggil require(); ESM tidak punya require bawaan
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});
