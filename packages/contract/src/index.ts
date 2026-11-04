import createClient from 'openapi-fetch';
import type { components, paths } from './generated/api.js';

export type { components, operations, paths } from './generated/api.js';
export * from './catalog.js';
export * from './errors.js';
export * from './taxonomy.js';

export type Schemas = components['schemas'];
export type Thread = Schemas['Thread'];
export type Message = Schemas['Message'];
export type Approval = Schemas['Approval'];
export type CairnEvent = Schemas['Event'];
export type ErrorResponse = Schemas['ErrorResponse'];
export type AuthProvider = Schemas['AuthProvider'];
export type ModelProvider = Schemas['ModelProvider'];

/** A typed client for the Cairn API. Every path, parameter and response comes from the spec. */
export function createCairnClient(baseUrl: string, fetchImpl?: typeof fetch) {
  return createClient<paths>({ baseUrl, ...(fetchImpl ? { fetch: fetchImpl } : {}) });
}
