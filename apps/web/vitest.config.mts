import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Next needs "jsx": "preserve" in tsconfig; the tests compile JSX themselves.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
