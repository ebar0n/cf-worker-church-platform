import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Setup follows the official Next.js guide:
// https://nextjs.org/docs/app/guides/testing/vitest
//
// - unit:       pure logic, node environment (tests/unit)
// - components: React components with Testing Library, jsdom (tests/components)
// - e2e:        real worker in workerd via `yarn test:e2e` (tests/e2e,
//               separate config — needs a build and a local server)
//
// Async Server Components are not supported by Vitest; per the guide those
// are covered by the e2e suite against the rendered pages.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      // Total app coverage: everything under src/ except Prisma's generated
      // client. Caveat: the E2E suite exercises API routes and pages inside
      // workerd (a separate process), which V8 coverage cannot instrument —
      // so this number reflects unit/component tests only and undercounts
      // the real tested surface.
      include: ['src/**'],
      exclude: ['src/prisma/**', '**/*.d.ts'],
      reporter: ['text-summary'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['tests/components/**/*.test.tsx'],
        },
      },
    ],
  },
});
