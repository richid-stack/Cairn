'use client';

import { useRouter } from 'next/navigation';
import { Composer } from './composer';
import { useSend } from './use-send';

/** The empty chat screen. The conversation is only created when the message actually goes. */
export function NewChat() {
  const router = useRouter();
  const send = useSend({ onSent: (id) => router.push(`/chat/${id}`) });
  return (
    <div className="thread">
      <div className="page-stack">
        <h1 className="page-title">What can I help with?</h1>
        <p className="page-lede">
          Ask for an errand, a reminder or a plan. Cairn shows you each step and asks before it does
          anything that matters.
        </p>
        {send.pending ? (
          <ol className="message-list" aria-label="Messages">
            <li className="message" data-role="user" data-pending={send.pending.phase}>
              <span className="message-author">You</span>
              <p className="message-text" dir="auto">
                {send.pending.text}
              </p>
              {send.pending.phase === 'failed' ? (
                <span className="message-state">Not sent</span>
              ) : (
                <span className="message-state">Sending…</span>
              )}
            </li>
          </ol>
        ) : null}
      </div>
      <div className="thread-dock">
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
