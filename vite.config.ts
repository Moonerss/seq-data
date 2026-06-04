import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/seq-data/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
