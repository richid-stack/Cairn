import { defineConfig, devices } from '@playwright/test';

// Browser tests for the real app, talking to the mock API. The app is built with the mock's
// address (see "e2e" in package.json) because Next fixes proxy targets when it builds.
const MOCK = 'http://127.0.0.1:4010';
const APP = 'http://127.0.0.1:3010';

export default defineConfig({
  testDir: 'e2e',
  // Tests share one mock, so they run one at a time. Each starts by emptying it.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: APP, reducedMotion: 'reduce' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1100, height: 720 } },
    },
    { name: 'phone', use: { ...devices['Pixel 5'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @cairn/mock-server dev',
      cwd: '../..',
      url: `${MOCK}/v1/health`,
      env: { PORT: '4010', CAIRN_MOCK_TEST_ROUTES: '1', STREAM_DELAY_MS: '0' },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec next start -p 3010',
      url: `${APP}/chat`,
      env: { CAIRN_API_URL: MOCK },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
