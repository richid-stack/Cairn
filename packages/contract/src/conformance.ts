import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { loadDereferencedSpec, type JsonObject } from './spec.js';

// ajv-formats is CommonJS; under NodeNext its default import is the module object.
const addFormats = addFormatsModule as unknown as typeof addFormatsModule.default;

/**
 * The conformance suite. The mock server and the real API are run through the same steps,
 * so the frontend can be built against the mock and trust that the real API behaves the same.
 *
 * `full`  - every route is implemented and must behave as the contract says.
 * `blank` - only the routes marked below exist; every other route must answer 501 with the
 *           standard error body. This is the state of the API at the end of Phase B0.
 */
export type Mode = 'full' | 'blank';

export interface StepResult {
  name: string;
  ok: boolean;
  detail?: string;
}

interface Reply {
  status: number;
  headers: Headers;
  text: string;
  json: unknown;
}

const terminalEvents = new Set(['run.completed', 'run.failed', 'run.cancelled']);

class Failure extends Error {}

function fail(message: string): never {
  throw new Failure(message);
}

export async function runConformance(
  baseUrl: string,
  options: { mode: Mode },
): Promise<StepResult[]> {
  const spec = await loadDereferencedSpec();
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);

  const responseSchema = (path: string, method: string, status: number): JsonObject => {
    const paths = spec.paths as Record<string, Record<string, JsonObject>>;
    const operation = paths[path]?.[method] as
      | { responses?: Record<string, { content?: Record<string, { schema?: JsonObject }> }> }
      | undefined;
    const schema = operation?.responses?.[String(status)]?.content?.['application/json']?.schema;
    if (!schema)
      fail(`The contract has no JSON schema for ${method.toUpperCase()} ${path} ${status}`);
    return schema;
  };
  const componentSchema = (name: string): JsonObject => {
    const schemas = (spec.components as { schemas: Record<string, JsonObject> }).schemas;
    const schema = schemas[name];
    if (!schema) fail(`The contract has no schema named ${name}`);
    return schema;
  };
  const check = (schema: JsonObject, value: unknown, label: string) => {
    const validate = ajv.compile(schema);
    if (!validate(value)) {
      fail(`${label} does not match the contract: ${ajv.errorsText(validate.errors)}`);
    }
  };

  const call = async (
    method: string,
    path: string,
    init: { body?: unknown; headers?: Record<string, string> } = {},
  ): Promise<Reply> => {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { status: response.status, headers: response.headers, text, json };
  };

  const expectJson = (reply: Reply, template: string, method: string, status: number) => {
    if (reply.status !== status) {
      fail(`${method.toUpperCase()} ${template}: expected ${status}, got ${reply.status}`);
    }
    check(responseSchema(template, method, status), reply.json, `${method} ${template} ${status}`);
  };

  const expectError = (reply: Reply, status: number, label: string) => {
    if (reply.status !== status) fail(`${label}: expected ${status}, got ${reply.status}`);
    check(componentSchema('ErrorResponse'), reply.json, `${label} error body`);
  };

  const readEvents = async (path: string, lastEventId?: string) => {
    const response = await fetch(baseUrl + path, {
      headers: {
        accept: 'text/event-stream',
        ...(lastEventId ? { 'last-event-id': lastEventId } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (response.status !== 200) fail(`GET ${path}: expected 200, got ${response.status}`);
    const type = response.headers.get('content-type') ?? '';
    if (!type.startsWith('text/event-stream')) fail(`GET ${path}: content-type was ${type}`);
    const body = await response.text();
    const events: { id: string; event: JsonObject }[] = [];
    for (const frame of body.split('\n\n')) {
      if (!frame.trim()) continue;
      let id = '';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('id:')) id = line.slice(3).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      const event = JSON.parse(data) as JsonObject;
      check(componentSchema('Event'), event, `event ${id}`);
      if (event.id !== id) fail(`event id field ${String(event.id)} does not match frame id ${id}`);
      events.push({ id, event });
    }
    return events;
  };

  const results: StepResult[] = [];
  const step = async (name: string, run: () => Promise<void>) => {
    try {
      await run();
      results.push({ name, ok: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      results.push({ name, ok: false, detail });
    }
  };

  const blank = options.mode === 'blank';
  const requestId = /.+/;

  // Routes that exist in both modes.
  await step('getHealth', async () => {
    const reply = await call('GET', '/v1/health');
    expectJson(reply, '/v1/health', 'get', 200);
  });
  await step('listAuthProviders', async () => {
    const reply = await call('GET', '/v1/auth/providers');
    expectJson(reply, '/v1/auth/providers', 'get', 200);
    const providers = (reply.json as { providers: { id: string }[] }).providers;
    const ids = new Set(providers.map((p) => p.id));
    if (ids.size !== providers.length) fail('Sign-in provider ids must be unique');
  });
  await step('unknown route answers with the standard error', async () => {
    const reply = await call('GET', '/v1/does-not-exist');
    expectError(reply, 404, 'GET /v1/does-not-exist');
    const body = reply.json as { error: { requestId: string } };
    if (!requestId.test(body.error.requestId)) fail('requestId is empty');
  });

  if (blank) {
    // Every other route is reserved: it must answer 501 with the standard error body.
    const reserved: [string, string, unknown?][] = [
      ['GET', '/v1/model-providers'],
      ['PUT', '/v1/model-keys/anthropic', { apiKey: 'placeholder-key' }],
      ['DELETE', '/v1/model-keys/anthropic'],
      ['GET', '/v1/threads'],
      ['POST', '/v1/threads', {}],
      ['GET', '/v1/threads/thr_x/messages'],
      ['POST', '/v1/threads/thr_x/messages', { text: 'hello' }],
      ['GET', '/v1/threads/thr_x/events'],
      ['POST', '/v1/approvals/apr_x/answer', { decision: 'approve' }],
    ];
    for (const [method, path, body] of reserved) {
      await step(`${method} ${path} is reserved (501)`, async () => {
        const reply = await call(method, path, body === undefined ? {} : { body });
        expectError(reply, 501, `${method} ${path}`);
        const code = (reply.json as { error: { code: string } }).error.code;
        if (code !== 'not_implemented') fail(`error code was ${code}, expected not_implemented`);
      });
    }
    return results;
  }

  // Full behavior.
  await step('listModelProviders', async () => {
    const reply = await call('GET', '/v1/model-providers');
    expectJson(reply, '/v1/model-providers', 'get', 200);
    const providers = (reply.json as { providers: { id: string; requiresKey: boolean }[] })
      .providers;
    if (providers.length < 3) fail('The catalog should list several providers');
  });

  await step('model keys are stored but never returned', async () => {
    const secret = 'sk-test-0123456789abcdef';
    const put = await call('PUT', '/v1/model-keys/anthropic', { body: { apiKey: secret } });
    expectJson(put, '/v1/model-keys/{providerId}', 'put', 200);
    if (put.text.includes(secret)) fail('The response leaked the key');
    const status = put.json as { last4: string };
    if (status.last4 !== secret.slice(-4)) fail('last4 should be the last four characters');
    const missing = await call('PUT', '/v1/model-keys/not-a-provider', {
      body: { apiKey: secret },
    });
    expectError(missing, 404, 'PUT unknown provider');
    const short = await call('PUT', '/v1/model-keys/anthropic', { body: { apiKey: 'x' } });
    expectError(short, 422, 'PUT too-short key');
    const del = await call('DELETE', '/v1/model-keys/anthropic');
    if (del.status !== 204) fail(`DELETE: expected 204, got ${del.status}`);
  });

  let threadId = '';
  await step('createThread is idempotent', async () => {
    const key = 'conformance-thread-0001';
    const first = await call('POST', '/v1/threads', {
      body: { title: 'Conformance' },
      headers: { 'idempotency-key': key },
    });
    expectJson(first, '/v1/threads', 'post', 201);
    const second = await call('POST', '/v1/threads', {
      body: { title: 'Conformance' },
      headers: { 'idempotency-key': key },
    });
    expectJson(second, '/v1/threads', 'post', 201);
    const a = first.json as { id: string };
    const b = second.json as { id: string };
    if (a.id !== b.id) fail('The same Idempotency-Key created two threads');
    threadId = a.id;
  });

  await step('listThreads pages with a cursor', async () => {
    const reply = await call('GET', '/v1/threads?limit=1');
    expectJson(reply, '/v1/threads', 'get', 200);
    const page = reply.json as { items: unknown[] };
    if (page.items.length > 1) fail('limit was ignored');
  });

  let runId = '';
  await step('sendMessage starts a run and is idempotent', async () => {
    const key = 'conformance-message-0001';
    const path = `/v1/threads/${threadId}/messages`;
    const first = await call('POST', path, {
      body: { text: 'Book me a table for two on Friday' },
      headers: { 'idempotency-key': key },
    });
    expectJson(first, '/v1/threads/{threadId}/messages', 'post', 202);
    const second = await call('POST', path, {
      body: { text: 'Book me a table for two on Friday' },
      headers: { 'idempotency-key': key },
    });
    const a = first.json as { message: { id: string }; runId: string };
    const b = second.json as { message: { id: string }; runId: string };
    if (a.message.id !== b.message.id || a.runId !== b.runId) {
      fail('The same Idempotency-Key started a second run');
    }
    runId = a.runId;
    const empty = await call('POST', path, { body: { text: '' } });
    expectError(empty, 422, 'POST empty message');
    const missing = await call('POST', '/v1/threads/thr_missing/messages', {
      body: { text: 'hi' },
    });
    expectError(missing, 404, 'POST message to missing thread');
  });

  await step('listMessages returns the conversation in order', async () => {
    const reply = await call('GET', `/v1/threads/${threadId}/messages`);
    expectJson(reply, '/v1/threads/{threadId}/messages', 'get', 200);
    const items = (reply.json as { items: { role: string }[] }).items;
    if (items[0]?.role !== 'user') fail('The first message should be the user message');
  });

  await step('event stream is valid, ordered and resumable', async () => {
    const path = `/v1/threads/${threadId}/events`;
    const all = await readEvents(path);
    if (all.length < 4) fail(`Expected a run's worth of events, got ${all.length}`);
    const ids = all.map((e) => Number(e.id));
    if (ids.some((id, i) => i > 0 && id <= (ids[i - 1] ?? 0))) fail('Event ids must increase');
    if (all[0]?.event.type !== 'run.started') fail('The stream should begin with run.started');
    const last = String(all[all.length - 1]?.event.type);
    if (!terminalEvents.has(last)) fail(`The stream ended on ${last}, not a terminal event`);
    const started = (all[0].event.data as { runId: string }).runId;
    if (started !== runId) fail('The stream belongs to a different run than the one just started');
    const cut = all[1]?.id ?? '';
    const resumed = await readEvents(path, cut);
    if (resumed.length !== all.length - 2) {
      fail(`Resuming after ${cut} should replay ${all.length - 2} events, got ${resumed.length}`);
    }
    if (resumed[0]?.id !== all[2]?.id) fail('Resume should continue right after Last-Event-ID');
    const missing = await call('GET', '/v1/threads/thr_missing/events');
    expectError(missing, 404, 'GET events for missing thread');
  });

  await step('answerApproval validates and rejects unknown ids', async () => {
    const unknown = await call('POST', '/v1/approvals/apr_missing/answer', {
      body: { decision: 'approve' },
    });
    expectError(unknown, 404, 'POST unknown approval');
    const bad = await call('POST', '/v1/approvals/apr_missing/answer', {
      body: { decision: 'maybe' },
    });
    if (bad.status !== 404 && bad.status !== 422) fail(`bad decision gave ${bad.status}`);
  });

  return results;
}
