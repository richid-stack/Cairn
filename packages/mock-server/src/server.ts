import { createMockServer } from './index.js';

const port = Number(process.env.PORT ?? 4000);
const app = createMockServer({
  streamDelayMs: Number(process.env.STREAM_DELAY_MS ?? 40),
  testRoutes: process.env.CAIRN_MOCK_TEST_ROUTES === '1',
});

app
  .listen({ port, host: '127.0.0.1' })
  .then(() => console.warn(`Cairn mock server on http://127.0.0.1:${port}`))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
