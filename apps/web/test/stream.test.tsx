import type { Message } from '@cairn/contract/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { threadKeys } from '../features/threads/queries';
import { useThreadStream } from '../features/threads/use-thread-stream';

const encoder = new TextEncoder();
const sse = (id: number, type: string, data: unknown) =>
  `id: ${id}\ndata: ${JSON.stringify({ id: String(id), type, threadId: 't', at: 'x', data })}\n\n`;

/** A response whose body delivers the chunks, then either ends or breaks like a lost connection. */
function response(chunks: string[], end: 'close' | 'break'): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      if (end === 'close') controller.close();
      // An errored stream throws away anything not yet read, so break it a moment later.
      else setTimeout(() => controller.error(new TypeError('network error')), 20);
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function setup() {
  const client = new QueryClient();
  const messages: { items: Message[]; nextCursor: null } = { items: [], nextCursor: null };
  client.setQueryData(threadKeys.messages('t'), messages);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

afterEach(() => vi.unstubAllGlobals());

describe('useThreadStream', () => {
  it('reconnects after a dropped connection with the last event id, losing and repeating nothing', async () => {
    const calls: Headers[] = [];
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      calls.push(new Headers(init?.headers));
      if (calls.length === 1) {
        return Promise.resolve(
          response(
            [
              sse(1, 'run.started', { runId: 'r' }),
              sse(2, 'message.delta', { messageId: 'm', text: 'Hello' }),
            ],
            'break',
          ),
        );
      }
      // The server repeats event 2 (it may resend from just before the id), then carries on.
      return Promise.resolve(
        response(
          [
            sse(2, 'message.delta', { messageId: 'm', text: 'Hello' }),
            sse(3, 'message.delta', { messageId: 'm', text: ' world' }),
            sse(4, 'message.complete', {
              message: {
                id: 'm',
                threadId: 't',
                role: 'agent',
                text: 'Hello world',
                createdAt: 'x',
              },
            }),
            sse(5, 'run.completed', { runId: 'r' }),
          ],
          'close',
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useThreadStream('t'), { wrapper });

    await waitFor(() => expect(result.current.view.lastEventId).toBe(5), { timeout: 5000 });
    expect(calls).toHaveLength(2);
    expect(calls[0]!.get('Last-Event-ID')).toBeNull();
    expect(calls[1]!.get('Last-Event-ID')).toBe('2');
    expect(result.current.view.drafts).toEqual([]);
    expect(result.current.view.lastEventId).toBe(5);
    const stored = client.getQueryData<{ items: Message[] }>(threadKeys.messages('t'));
    expect(stored?.items.map((m) => m.text)).toEqual(['Hello world']);
    await waitFor(() => expect(result.current.connection).toBe('closed'));
  }, 10000);

  it('stays closed when the conversation does not exist', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 404 })));
    vi.stubGlobal('fetch', fetchMock);
    const { wrapper } = setup();
    const { result } = renderHook(() => useThreadStream('t'), { wrapper });
    await waitFor(() => expect(result.current.connection).toBe('closed'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('opens the stream again on resume', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(response([], 'close')));
    vi.stubGlobal('fetch', fetchMock);
    const { wrapper } = setup();
    const { result } = renderHook(() => useThreadStream('t'), { wrapper });
    await waitFor(() => expect(result.current.connection).toBe('closed'));
    act(() => result.current.resume());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
