import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = buildApp(config);

app
  .listen({ port: config.port, host: config.host })
  .then(() => console.warn(`Cairn API ${config.version} on http://${config.host}:${config.port}`))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
