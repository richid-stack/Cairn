'use client';

import type { Message, Thread } from '@cairn/contract/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, unwrap } from '../../lib/api';
import { threadKeys } from './queries';
import { upsertMessage } from './use-thread-stream';

/** How long a sent message can still be taken back. Set at build time; tests shorten it. */
export const undoWindowMs = Number(process.env.NEXT_PUBLIC_CAIRN_UNDO_MS ?? 5000);

export const maxMessageLength = 20000;

export interface PendingSend {
  text: string;
  /** holding: Undo is still possible. sending: on its way. failed: it did not go. */
  phase: 'holding' | 'sending' | 'failed';
  error?: unknown;
}

/** A short title from the first message, so the conversation list reads well. */
export function titleFrom(text: string): string {
  const line = text.trim().split(/\r?\n/)[0] ?? '';
  const words = line.split(/\s+/).filter(Boolean).join(' ');
  if (words.length <= 60) return words || 'New conversation';
  return `${words.slice(0, 59).trimEnd()}…`;
}

interface Options {
  /** The conversation to send to. Leave out on the new-chat screen, where one is created. */
  threadId?: string;
  /** Called with the conversation's id once the message is accepted. */
  onSent: (threadId: string, message: Message) => void;
}

/**
 * Sending with a short Undo window. The message is held for a few seconds, and nothing is
 * created or sent until then, so Undo leaves no trace. Each step has its own Idempotency-Key,
 * kept across retries, so a retry after a dropped connection can never send twice or create
 * a second conversation.
 */
export function useSend({ threadId, onSent }: Options) {
  const client = useQueryClient();
  const [pending, setPending] = useState<PendingSend | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const keys = useRef<{ thread: string; message: string } | null>(null);
  const createdThread = useRef<string | undefined>(undefined);
  const onSentRef = useRef(onSent);
  onSentRef.current = onSent;
  const textRef = useRef('');
  const mounted = useRef(true);
  const phase = useRef<PendingSend['phase'] | null>(null);

  const deliver = useCallback(async () => {
    const text = textRef.current;
    phase.current = 'sending';
    setPending({ text, phase: 'sending' });
    try {
      let id = threadId ?? createdThread.current;
      if (!id) {
        const created = await unwrap<Thread>(
          api().POST('/v1/threads', {
            body: { title: titleFrom(text) },
            params: { header: { 'Idempotency-Key': keys.current!.thread } },
          }),
        );
        id = created.id;
        createdThread.current = id;
      }
      const accepted = await unwrap<{ message: Message; runId: string }>(
        api().POST('/v1/threads/{threadId}/messages', {
          params: { path: { threadId: id }, header: { 'Idempotency-Key': keys.current!.message } },
          body: { text },
        }),
      );
      // Seed the list so the message is there the moment the conversation opens.
      const key = threadKeys.messages(id);
      if (client.getQueryData(key)) upsertMessage(client, id, accepted.message);
      else client.setQueryData(key, { items: [accepted.message], nextCursor: null });
      void client.invalidateQueries({ queryKey: threadKeys.list });
      keys.current = null;
      createdThread.current = undefined;
      phase.current = null;
      setPending(null);
      // If the person has gone elsewhere, the message still went; just do not pull them back.
      if (mounted.current) onSentRef.current(id, accepted.message);
    } catch (error) {
      phase.current = 'failed';
      setPending({ text, phase: 'failed', error });
    }
  }, [client, threadId]);

  const deliverRef = useRef(deliver);
  deliverRef.current = deliver;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Leaving during the Undo window sends the message rather than losing it.
      if (phase.current === 'holding') {
        clearTimeout(timer.current);
        void deliverRef.current();
      }
    };
  }, []);

  // Closing the tab cannot finish a two-step send, so ask first while a message is held.
  useEffect(() => {
    if (pending?.phase !== 'holding') return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending?.phase]);

  /** Starts the Undo window. Returns false if a message is already on its way. */
  const send = useCallback(
    (text: string): boolean => {
      if (pending) return false;
      textRef.current = text;
      keys.current = { thread: crypto.randomUUID(), message: crypto.randomUUID() };
      createdThread.current = undefined;
      phase.current = 'holding';
      setPending({ text, phase: 'holding' });
      timer.current = setTimeout(() => void deliver(), undoWindowMs);
      return true;
    },
    [pending, deliver],
  );

  /** Takes the message back. Returns its text so the composer can show it again. */
  const undo = useCallback((): string | null => {
    if (!pending || pending.phase !== 'holding') return null;
    clearTimeout(timer.current);
    keys.current = null;
    phase.current = null;
    setPending(null);
    return pending.text;
  }, [pending]);

  /** Tries a failed send again, with the same keys. */
  const retry = useCallback(() => {
    if (pending?.phase === 'failed') void deliver();
  }, [pending, deliver]);

  /** Gives up on a failed send and returns its text to the composer. */
  const discard = useCallback((): string | null => {
    if (pending?.phase !== 'failed') return null;
    keys.current = null;
    createdThread.current = undefined;
    phase.current = null;
    setPending(null);
    return pending.text;
  }, [pending]);

  /** Sends now, skipping the rest of the Undo window. */
  const sendNow = useCallback(() => {
    if (pending?.phase !== 'holding') return;
    clearTimeout(timer.current);
    void deliver();
  }, [pending, deliver]);

  return { pending, send, undo, retry, discard, sendNow };
}
