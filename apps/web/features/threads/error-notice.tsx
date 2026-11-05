'use client';

import { Button } from '@cairn/ui';
import { ApiError } from '../../lib/api';

/** A failed load, in plain words, with what to do and a way to try again. */
export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const known = error instanceof ApiError ? error : undefined;
  return (
    <div role="alert" className="notice" data-tone="danger">
      <p className="notice-message">{known?.message ?? 'Something went wrong.'}</p>
      <p className="notice-fix">{known?.fix ?? 'Try again in a moment.'}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
