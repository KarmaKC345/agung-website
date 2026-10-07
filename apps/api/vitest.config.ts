import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // tes memakai satu database lokal bersama, jadi jalan berurutan
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
