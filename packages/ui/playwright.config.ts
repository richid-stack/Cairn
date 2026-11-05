import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'visual',
  // Failures are about pixels and rules, not timing, so a retry would only hide a real change.
  retries: 0,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:6007',
    viewport: { width: 720, height: 480 },
    deviceScaleFactor: 1,
    // Motion tokens collapse to 1 ms, so screenshots never catch an animation half way.
    reducedMotion: 'reduce',
    colorScheme: 'light',
    launchOptions: { args: ['--font-render-hinting=none', '--disable-lcd-text'] },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 25,
      animations: 'disabled',
      // Playwright's default comparison ignores anti-aliased edge pixels, so a changed corner
      // radius would slip through. This comparator does not. Playwright marks the option as
      // internal, so a Playwright upgrade must re-run the "does it catch a change" check below.
      ...({ _comparator: 'ssim-cie94' } as object),
    },
  },
  webServer: {
    command: 'node visual/serve.mjs',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: !process.env.CI,
  },
});
