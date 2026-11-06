'use client';

import { Button, Icon, VisuallyHidden } from '@cairn/ui';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { defaultAgentName } from '../../lib/agent';
import { ErrorNotice } from './error-notice';
import { maxMessageLength, type PendingSend } from './use-send';

export interface ComposerProps {
  pending: PendingSend | null;
  onSend: (text: string) => boolean;
  onUndo: () => string | null;
  onRetry: () => void;
  onDiscard: () => string | null;
  onSendNow: () => void;
}

/** On a phone the Enter key adds a line, because the Send button is right there. */
function enterSends(): boolean {
  return !window.matchMedia('(pointer: coarse)').matches;
}

export function Composer({
  pending,
  onSend,
  onUndo,
  onRetry,
  onDiscard,
  onSendNow,
}: ComposerProps) {
  const [text, setText] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const noteId = useId();
  const trimmed = text.trim();
  const tooLong = text.length > maxMessageLength;
  const blocked = pending !== null;

  const restore = (back: string | null) => {
    if (back === null) return;
    setText((now) => (now.trim() ? `${back}\n\n${now}` : back));
    // Put the cursor back where the person can keep typing.
    requestAnimationFrame(() => field.current?.focus());
  };

  const submit = () => {
    if (!trimmed || tooLong || blocked) return;
    if (onSend(trimmed)) setText('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter while composing text in an input method picks a word; it is not a send.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    if (!enterSends()) return;
    event.preventDefault();
    submit();
  };

  return (
    <form
      className="composer"
      aria-label="New message"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {pending?.phase === 'failed' ? (
        <div className="composer-notice">
          <ErrorNotice error={pending.error} onRetry={onRetry} />
          <Button size="sm" variant="ghost" onClick={() => restore(onDiscard())}>
            Edit message
          </Button>
        </div>
      ) : null}
      <div className="composer-row">
        <label className="cairn-visually-hidden" htmlFor={`${noteId}-field`}>
          Message {defaultAgentName}
        </label>
        <textarea
          id={`${noteId}-field`}
          ref={field}
          className="cairn-input composer-field"
          rows={1}
          dir="auto"
          value={text}
          placeholder={`Message ${defaultAgentName}`}
          aria-invalid={tooLong || undefined}
          aria-describedby={tooLong ? noteId : undefined}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button
          type="submit"
          icon={<Icon name="send" size="sm" />}
          disabled={!trimmed || tooLong || blocked}
        >
          Send
        </Button>
      </div>
      {tooLong ? (
        <p id={noteId} className="cairn-field-error">
          That is longer than {maxMessageLength.toLocaleString('en')} characters. Split it into two
          messages.
        </p>
      ) : null}
      {pending?.phase === 'holding' ? (
        <div className="composer-undo">
          <span>Sending in a moment.</span>
          <Button
            size="sm"
            variant="secondary"
            icon={<Icon name="undo" size="sm" />}
            onClick={() => restore(onUndo())}
          >
            Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={onSendNow}>
            Send now
          </Button>
        </div>
      ) : null}
      <VisuallyHidden role="status">
        {pending?.phase === 'holding'
          ? 'Message will send in a moment. Choose Undo to take it back.'
          : pending?.phase === 'sending'
            ? 'Sending'
            : ''}
      </VisuallyHidden>
    </form>
  );
}
