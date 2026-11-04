import { runConformance } from '@cairn/contract/conformance';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const app = buildApp(loadConfig({}));
let base = '';

beforeAll(async () => {
  await app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
afterAll(() => app.close());

describe('api (blank, phase B0)', () => {
  it('passes the blank-mode conformance suite', async () => {
    const results = await runConformance(base, { mode: 'blank' });
    const failures = results.filter((r) => !r.ok);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(results.length).toBeGreaterThan(10);
  });
});

describe('config', () => {
  it('lists only the sign-in methods an instance enables', () => {
    const config = loadConfig({ AUTH_PROVIDERS: 'google, email' });
    expect(config.authProviders.map((p) => p.id)).toEqual(['google', 'email']);
  });

  it('refuses an unknown provider instead of ignoring it', () => {
    expect(() => loadConfig({ AUTH_PROVIDERS: 'google,myspace' })).toThrow(/myspace/);
  });
});
