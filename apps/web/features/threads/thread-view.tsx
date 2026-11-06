'use client';

import {
  Button,
  Icon,
  Skeleton,
  SkeletonGroup,
  SkeletonText,
  VisuallyHidden,
  buttonStyle,
} from '@cairn/ui';
import Link from 'next/link';
import { useEffect } from 'react';
import { defaultAgentName } from '../../lib/agent';
import { ApiError } from '../../lib/api';
import { ApprovalCard } from './approval-card';
import { Composer } from './composer';
import { ErrorNotice } from './error-notice';
import { useMessages, useThread } from './queries';
import type { RunView } from './run-state';
import { useSend } from './use-send';
import { useStickToBottom } from './use-stick-to-bottom';
import { useThreadStream } from './use-thread-stream';

export function ThreadView({ threadId }: { threadId: string }) {
  const thread = useThread(threadId);
  const messages = useMessages(threadId);
  const stream = useThreadStream(threadId);
  const send = useSend({ threadId, onSent: () => stream.resume() });
  const { view } = stream;

  const messageItems = messages.data?.items ?? [];
  const known = new Set(messageItems.map((m) => m.id));
  // A reply that is still arriving, unless the full message has already been stored.
  const drafts = view.drafts.filter((d) => !known.has(d.messageId));
  const lastDraft = drafts.at(-1);
  const { behind, jump } = useStickToBottom(
    `${messageItems.length}:${lastDraft?.text.length ?? 0}:${view.steps.length}:${view.phase}:${send.pending?.phase ?? ''}`,
  );

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
    <div className="thread">
      <div className="page-stack">
        <h1 className="page-title">{thread.data.title}</h1>
        {messages.isPending ? (
          <SkeletonGroup label="Loading messages">
            <SkeletonText lines={3} />
          </SkeletonGroup>
        ) : messages.isError ? (
          <ErrorNotice error={messages.error} onRetry={() => void messages.refetch()} />
        ) : messageItems.length === 0 && drafts.length === 0 && !send.pending ? (
          <p className="page-lede">Nothing has been said yet. Write below to begin.</p>
        ) : (
          <ol className="message-list" aria-label="Messages">
            {messageItems.map((message) => (
              <MessageItem key={message.id} role={message.role} text={message.text} />
            ))}
            {send.pending ? (
              <MessageItem role="user" text={send.pending.text} pending={send.pending.phase} />
            ) : null}
            {drafts.map((draft) => (
              <MessageItem key={draft.messageId} role="agent" text={draft.text} streaming />
            ))}
          </ol>
        )}
        <Activity view={view} />
        {view.phase === 'waiting' && view.approval ? (
          <ApprovalCard approval={view.approval} onAnswered={() => stream.resume()} />
        ) : null}
        {view.phase === 'failed' && view.failure ? (
          <div role="alert" className="notice" data-tone="danger">
            <p className="notice-message">{view.failure.message}</p>
            {view.failure.fix ? <p className="notice-fix">{view.failure.fix}</p> : null}
          </div>
        ) : null}
        {view.phase === 'cancelled' ? (
          <p className="page-lede" role="status">
            That was stopped before it finished.
          </p>
        ) : null}
        {stream.connection === 'reconnecting' ? (
          <p className="connection-note" role="status">
            Connection lost. Reconnecting…
          </p>
        ) : null}
        <VisuallyHidden role="status" aria-live="polite">
          {view.phase === 'running' && view.status ? view.status : ''}
        </VisuallyHidden>
      </div>
      <div className="thread-dock">
        {behind ? (
          <Button
            className="jump-latest"
            size="sm"
            variant="secondary"
            icon={<Icon name="chevron-down" size="sm" />}
            onClick={jump}
          >
            Jump to latest
          </Button>
        ) : null}
        <Composer
          pending={send.pending}
          onSend={send.send}
          onUndo={send.undo}
          onRetry={send.retry}
          onDiscard={send.discard}
          onSendNow={send.sendNow}
        />
      </div>
    </div>
  );
}

function MessageItem({
  role,
  text,
  pending,
  streaming,
}: {
  role: 'user' | 'agent';
  text: string;
  pending?: 'holding' | 'sending' | 'failed';
  streaming?: boolean;
}) {
  return (
    <li
      className="message"
      data-role={role}
      data-pending={pending}
      data-streaming={streaming || undefined}
    >
      <span className="message-author">{role === 'user' ? 'You' : defaultAgentName}</span>
      <p className="message-text" dir="auto">
        {text}
      </p>
      {pending === 'holding' || pending === 'sending' ? (
        <span className="message-state">Sending…</span>
      ) : null}
      {pending === 'failed' ? <span className="message-state">Not sent</span> : null}
    </li>
  );
}

/** What the agent is doing, or did: each step in plain words. */
function Activity({ view }: { view: RunView }) {
  if (view.steps.length === 0 && !(view.phase === 'running' && view.status)) return null;
  const list = (
    <ul className="steps">
      {view.steps.map((step) => (
        <li key={step.id} className="step" data-status={step.status}>
          <Icon
            name={
              step.status === 'succeeded' ? 'success' : step.status === 'failed' ? 'error' : 'clock'
            }
            size="sm"
          />
          <span>{step.title}</span>
          <VisuallyHidden>
            {step.status === 'succeeded'
              ? ', done'
              : step.status === 'failed'
                ? ', failed'
                : ', in progress'}
          </VisuallyHidden>
        </li>
      ))}
    </ul>
  );
  if (view.phase === 'idle') {
    return (
      <details className="activity">
        <summary>
          {view.steps.length === 1
            ? 'What I did (1 step)'
            : `What I did (${view.steps.length} steps)`}
        </summary>
        {list}
      </details>
    );
  }
  return (
    <div className="activity" data-live>
      {view.status ? <p className="activity-status">{view.status}…</p> : null}
      {list}
    </div>
  );
}
