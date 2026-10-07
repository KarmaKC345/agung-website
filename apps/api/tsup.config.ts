import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // paket workspace ditulis dalam TS, jadi dibundel ke dalam dist
  noExternal: ['@newagung/shared'],
});
