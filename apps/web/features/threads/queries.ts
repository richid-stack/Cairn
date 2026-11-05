'use client';

import type { Message, Thread } from '@cairn/contract/client';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../../lib/api';

export const threadKeys = {
  list: ['threads'] as const,
  one: (id: string) => ['threads', id] as const,
  messages: (id: string) => ['threads', id, 'messages'] as const,
};

export function useThreads() {
  return useInfiniteQuery({
    queryKey: threadKeys.list,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap<{ items: Thread[]; nextCursor: string | null }>(
        api().GET('/v1/threads', {
          params: { query: { limit: 30, ...(pageParam ? { cursor: pageParam } : {}) } },
        }),
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: threadKeys.one(id),
    queryFn: () =>
      unwrap<Thread>(api().GET('/v1/threads/{threadId}', { params: { path: { threadId: id } } })),
  });
}

export function useMessages(id: string) {
  return useQuery({
    queryKey: threadKeys.messages(id),
    queryFn: () =>
      unwrap<{ items: Message[]; nextCursor: string | null }>(
        api().GET('/v1/threads/{threadId}/messages', {
          params: { path: { threadId: id }, query: { limit: 100 } },
        }),
      ),
  });
}
