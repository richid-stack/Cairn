import { createCairnClient, type ErrorResponse } from '@cairn/contract/client';

let client: ReturnType<typeof createCairnClient> | undefined;

/** The typed API client. Browser only: it talks to the same address as the page. */
export function api() {
  client ??= createCairnClient(window.location.origin);
  return client;
}

/** An error from the API, in the standard shape, or a network failure. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    /** What the person can do about it, when the API says. */
    readonly fix?: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Returns the data, or throws an ApiError. Network failures become one too, with a plain message. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result;
  try {
    result = await request;
  } catch {
    throw new ApiError(
      'Cairn could not be reached.',
      0,
      'network',
      'Check your connection and try again.',
    );
  }
  if (result.error !== undefined || result.data === undefined) {
    const body = result.error as Partial<ErrorResponse> | undefined;
    throw new ApiError(
      body?.error?.message ?? 'Something went wrong.',
      result.response.status,
      body?.error?.code ?? 'unknown',
      body?.error?.fix,
      body?.error?.requestId,
    );
  }
  return result.data;
}
