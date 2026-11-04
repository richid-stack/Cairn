import type { components } from './generated/api.js';

export type ErrorBody = components['schemas']['ErrorResponse'];

/** The one error shape every route uses: a stable code, plain words, and what to do next. */
export function errorBody(
  code: string,
  message: string,
  requestId: string,
  fix?: string,
): ErrorBody {
  return { error: { code, message, requestId, ...(fix ? { fix } : {}) } };
}
