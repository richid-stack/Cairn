import { runConformance } from '@cairn/contract/conformance';
import type { CairnEvent, Message } from '@cairn/contract';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMockServer } from '../src/index.js';

const app = createMockServer({ now: () => new Date('2026-11-03T10:00:00.000Z') });
let base = '';

beforeAll(async () => {
  await app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
afterAll(() => app.close());

describe('mock server', () => {
  it('passes the full conformance suite', async () => {
    const results = await runConformance(base, { mode: 'full' });
    const failures = results.filter((r) => !r.ok);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(results.length).toBeGreaterThan(8);
  });

  it('holds a run for approval, then finishes it when answered', async () => {
    const thread = (await (await fetch(`${base}/v1/threads`, { method: 'POST' })).json()) as {
      id: string;
    };
    await fetch(`${base}/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Please /approve-demo this' }),
    });
    const read = async () =>
      (await (await fetch(`${base}/v1/threads/${thread.id}/events`)).text())
        .split('\n\n')
        .filter((f) => f.includes('data:'))
        .map((f) => JSON.parse(f.split('data:')[1] ?? '{}') as CairnEvent);

    const before = await read();
    const waiting = before.at(-1);
    expect(waiting?.type).toBe('run.waiting_approval');
    const approvalId = (waiting?.data as { approval: { id: string } }).approval.id;

    const answered = await fetch(`${base}/v1/approvals/${approvalId}/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    });
    expect(answered.status).toBe(200);
    const again = await fetch(`${base}/v1/approvals/${approvalId}/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    });
    expect(again.status).toBe(409);

    const after = await read();
    expect(after.map((e) => e.type).slice(-3)).toEqual(
      ['message.delta', 'message.complete', 'run.completed'].slice(-3),
    );
    const messages = (await (await fetch(`${base}/v1/threads/${thread.id}/messages`)).json()) as {
      items: Message[];
    };
    expect(messages.items.at(-1)?.role).toBe('agent');
  });

  it('is repeatable with a fixed clock', async () => {
    const res = await fetch(`${base}/v1/health`);
    const body = (await res.json()) as { time: string };
    expect(body.time).toBe('2026-11-03T10:00:00.000Z');
  });
});
