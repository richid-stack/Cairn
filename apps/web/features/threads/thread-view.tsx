'use client';

import { Skeleton, SkeletonGroup, SkeletonText, buttonStyle } from '@cairn/ui';
import Link from 'next/link';
import { useEffect } from 'react';
import { defaultAgentName } from '../../lib/agent';
import { ApiError } from '../../lib/api';
import { ErrorNotice } from './error-notice';
import { useMessages, useThread } from './queries';

export function ThreadView({ threadId }: { threadId: string }) {
  const thread = useThread(threadId);
  const messages = useMessages(threadId);

  // The tab and the screen reader both announce the conversation by its name.
  useEffect(() => {
    if (thread.data) document.title = `${thread.data.title} · Cairn`;
  }, [thread.data]);

  if (thread.isError && thread.error instanceof ApiError && thread.error.status === 404) {
    return (
      <div className="page-stack">
        <h1 className="page-title">That conversation is not here</h1>
        <p className="page-lede">It may have been deleted, or the address is mistyped.</p>
        <Link href="/chat" {...buttonStyle({ variant: 'secondary' })}>
          Start a new chat
        </Link>
      </div>
    );
  }

  if (thread.isError) {
    return <ErrorNotice error={thread.error} onRetry={() => void thread.refetch()} />;
  }

  if (thread.isPending) {
    return (
      <SkeletonGroup label="Loading conversation">
        <Skeleton width="40%" height="2rem" />
        <SkeletonText lines={4} />
      </SkeletonGroup>
    );
  }

  return (
    <div className="page-stack">
      <h1 className="page-title">{thread.data.title}</h1>
      {messages.isPending ? (
        <SkeletonGroup label="Loading messages">
          <SkeletonText lines={3} />
        </SkeletonGroup>
      ) : messages.isError ? (
        <ErrorNotice error={messages.error} onRetry={() => void messages.refetch()} />
      ) : messages.data.items.length === 0 ? (
        <p className="page-lede">Nothing has been said yet.</p>
      ) : (
        <ol className="message-list" aria-label="Messages">
          {messages.data.items.map((message) => (
            <li key={message.id} className="message" data-role={message.role}>
              <span className="message-author">
                {message.role === 'user' ? 'You' : defaultAgentName}
              </span>
              <p className="message-text" dir="auto">
                {message.text}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
