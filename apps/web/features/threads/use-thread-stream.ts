'use client';

import type { CairnEvent, Message } from '@cairn/contract/client';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSse } from '../../lib/sse';
import { threadKeys } from './queries';
import {
  applyEvent,
  completedMessage,
  expectsMoreEvents,
  initialRunView,
  type RunView,
} from './run-state';

export type Connection = 'connecting' | 'live' | 'reconnecting' | 'closed';

/** Waits before the next try: 0.5 s, 1 s, 2 s, 4 s, then every 8 s, with a little jitter. */
export function backoffMs(attempt: number): number {
  const base = Math.min(8000, 500 * 2 ** attempt);
  return base + Math.random() * 250;
}

/** Puts a message in the cached list, replacing one with the same id. */
export function upsertMessage(client: QueryClient, threadId: string, message: Message) {
  const key = threadKeys.messages(threadId);
  const old = client.getQueryData<{ items: Message[]; nextCursor: string | null }>(key);
  if (!old) {
    // The list has not loaded yet; when it does it will include this message.
    void client.invalidateQueries({ queryKey: key });
    return;
  }
  const at = old.items.findIndex((m) => m.id === message.id);
  const items = at === -1 ? [...old.items, message] : old.items.with(at, message);
  client.setQueryData(key, { ...old, items });
}

/** Runs `fn` on the next frame, or within 100 ms if the tab is hidden and frames are paused. */
function onNextFrame(fn: () => void): void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 100);
}

/**
 * Follows a conversation's live events. Text is applied once per frame, so a fast stream does
 * not make the page redraw hundreds of times a second. If the connection drops while the agent
 * is working, it reconnects with the last event it saw, so nothing is lost or repeated.
 * Call `resume` after sending a message or answering an approval, to open the stream again.
 */
export function useThreadStream(threadId: string) {
  const client = useQueryClient();
  const [view, setView] = useState<RunView>(initialRunView);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [generation, setGeneration] = useState(0);
  const viewRef = useRef<RunView>(initialRunView);

  const resume = useCallback(() => setGeneration((g) => g + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let queue: CairnEvent[] = [];
    let scheduled = false;

    const flush = () => {
      scheduled = false;
      if (signal.aborted || queue.length === 0) return;
      const batch = queue;
      queue = [];
      for (const event of batch) {
        const message = completedMessage(event);
        if (message) upsertMessage(client, threadId, message);
        if (event.type === 'run.completed' || event.type === 'run.failed') {
          void client.invalidateQueries({ queryKey: threadKeys.list });
        }
      }
      viewRef.current = batch.reduce(applyEvent, viewRef.current);
      setView(viewRef.current);
    };

    const enqueue = (event: CairnEvent) => {
      queue.push(event);
      if (!scheduled) {
        scheduled = true;
        onNextFrame(flush);
      }
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener('abort', () => (clearTimeout(timer), resolve()), { once: true });
      });

    void (async () => {
      let failures = 0;
      while (!signal.aborted) {
        try {
          const headers: Record<string, string> = { Accept: 'text/event-stream' };
          if (viewRef.current.lastEventId > 0) {
            headers['Last-Event-ID'] = String(viewRef.current.lastEventId);
          }
          const response = await fetch(`/v1/threads/${encodeURIComponent(threadId)}/events`, {
            headers,
            signal,
            cache: 'no-store',
          });
          // A missing or forbidden conversation will not appear by retrying; the page says so.
          if (response.status >= 400 && response.status < 500) {
            setConnection('closed');
            return;
          }
          if (!response.ok || !response.body) throw new Error(`stream ${response.status}`);
          failures = 0;
          setConnection('live');
          for await (const message of parseSse(response.body)) {
            try {
              enqueue(JSON.parse(message.data) as CairnEvent);
            } catch {
              // A garbled event is skipped rather than ending the conversation.
            }
          }
          if (signal.aborted) return;
          // The server ended the stream. Apply what arrived before deciding what comes next.
          flush();
          if (!expectsMoreEvents(viewRef.current)) {
            setConnection('closed');
            return;
          }
          // It ended mid-run: reconnect, after a beat so a faulty server is not hammered.
          setConnection('reconnecting');
          await wait(backoffMs(failures++));
        } catch {
          if (signal.aborted) return;
          flush();
          setConnection('reconnecting');
          await wait(backoffMs(failures++));
        }
      }
    })();

    return () => controller.abort();
  }, [client, threadId, generation]);

  return { view, connection, resume };
}
