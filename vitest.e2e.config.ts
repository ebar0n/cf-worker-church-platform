import { defineConfig } from 'vitest/config';

// E2E smoke tests: run the built worker in workerd (wrangler dev) with local
// D1/R2 and the Turnstile test secret. Run with `yarn test:e2e`.
// Requires a build first (`yarn cf:build`); the global setup builds if missing.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/e2e/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
  resolve: {
    tsconfigPaths: true,
  },
});
