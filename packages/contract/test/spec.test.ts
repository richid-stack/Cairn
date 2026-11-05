import { describe, expect, it } from 'vitest';
import { listOperations, loadDereferencedSpec, loadSpec } from '../src/spec.js';

// Adding a route means adding it here AND to the conformance suite. This list is the reminder.
const expectedOperations = [
  'answerApproval',
  'createThread',
  'deleteModelKey',
  'getHealth',
  'getThread',
  'listAuthProviders',
  'listMessages',
  'listModelProviders',
  'listThreads',
  'putModelKey',
  'sendMessage',
  'streamThreadEvents',
];

describe('openapi contract', () => {
  it('lists exactly the operations the conformance suite covers', () => {
    const ids = listOperations()
      .map((op) => op.operationId)
      .sort();
    expect(ids).toEqual(expectedOperations);
  });

  it('has unique operation ids', () => {
    const ids = listOperations().map((op) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every $ref', async () => {
    const spec = await loadDereferencedSpec();
    expect(JSON.stringify(spec)).not.toContain('"$ref"');
  });

  it('is OpenAPI 3.1', () => {
    expect(loadSpec().openapi).toBe('3.1.0');
  });

  it('gives every write route an Idempotency-Key parameter', () => {
    const spec = loadSpec() as {
      paths: Record<
        string,
        Record<string, { operationId?: string; parameters?: { $ref?: string }[] }>
      >;
    };
    const writes = listOperations().filter((op) => op.method === 'post' || op.method === 'put');
    for (const op of writes) {
      const params = spec.paths[op.path]?.[op.method]?.parameters ?? [];
      const has = params.some((p) => p.$ref === '#/components/parameters/IdempotencyKey');
      expect(has, `${op.operationId} should accept Idempotency-Key`).toBe(true);
    }
  });
});
