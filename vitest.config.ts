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
