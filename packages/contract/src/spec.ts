import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { parse } from 'yaml';

export const specPath = fileURLToPath(new URL('../openapi/cairn.v1.yaml', import.meta.url));

export type JsonObject = Record<string, unknown>;

export interface OperationInfo {
  operationId: string;
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
}

const methods = ['get', 'post', 'put', 'delete'] as const;

/** The spec exactly as written, with `$ref`s left in place. */
export function loadSpec(): JsonObject {
  return parse(readFileSync(specPath, 'utf8')) as JsonObject;
}

/** The spec with every `$ref` replaced by its target, ready for schema validation. */
export async function loadDereferencedSpec(): Promise<JsonObject> {
  return (await $RefParser.dereference(structuredClone(loadSpec()))) as JsonObject;
}

/** Every operation in the contract, in document order. */
export function listOperations(spec: JsonObject = loadSpec()): OperationInfo[] {
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>;
  const out: OperationInfo[] = [];
  for (const [path, item] of Object.entries(paths)) {
    for (const method of methods) {
      const op = item[method] as { operationId?: string } | undefined;
      if (op?.operationId) out.push({ operationId: op.operationId, method, path });
    }
  }
  return out;
}
