'use client';

import type { Approval } from '@cairn/contract/client';
import { Button, Icon } from '@cairn/ui';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef } from 'react';
import { defaultAgentName } from '../../lib/agent';
import { api, unwrap } from '../../lib/api';
import { ErrorNotice } from './error-notice';

/** Risk is always written out, never shown by color alone. */
export const riskLabels = [
  'Just reading',
  'Low risk',
  'Medium risk',
  'High risk',
  'Very high risk',
] as const;

export function riskLabel(risk: number): string {
  return riskLabels[Math.min(Math.max(Math.trunc(risk), 0), 4)] ?? riskLabels[4];
}

/**
 * Cairn asks before it acts. This card says what it wants to do in plain words, and nothing
 * happens until you choose. Each tap carries its own Idempotency-Key, so a double tap or a
 * retry cannot answer twice.
 */
export function ApprovalCard({
  approval,
  onAnswered,
}: {
  approval: Approval;
  onAnswered: () => void;
}) {
  const headingId = useId();
  const card = useRef<HTMLElement>(null);
  const key = useRef(crypto.randomUUID());

  // A decision is waiting on you, so bring it to your attention when it appears.
  useEffect(() => {
    card.current?.focus({ preventScroll: false });
  }, [approval.id]);

  const answer = useMutation({
    mutationFn: (decision: 'approve' | 'deny') =>
      unwrap<Approval>(
        api().POST('/v1/approvals/{approvalId}/answer', {
          params: { path: { approvalId: approval.id }, header: { 'Idempotency-Key': key.current } },
          body: { decision },
        }),
      ),
    onSuccess: () => onAnswered(),
  });

  return (
    <section
      ref={card}
      tabIndex={-1}
      className="approval"
      aria-labelledby={headingId}
      data-risk={approval.risk}
    >
      <h2 id={headingId} className="approval-title">
        <Icon name="shield" size="sm" />
        {defaultAgentName} is asking first
      </h2>
      <p className="approval-summary" dir="auto">
        {approval.summary}
      </p>
      <p className="approval-risk">{riskLabel(approval.risk)}</p>
      {answer.isError ? (
        <ErrorNotice
          error={answer.error}
          onRetry={() => answer.mutate(answer.variables ?? 'deny')}
        />
      ) : null}
      <div className="approval-actions">
        <Button
          loading={answer.isPending && answer.variables === 'approve'}
          loadingLabel="Approving"
          disabled={answer.isPending && answer.variables !== 'approve'}
          onClick={() => answer.mutate('approve')}
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          loading={answer.isPending && answer.variables === 'deny'}
          loadingLabel="Declining"
          disabled={answer.isPending && answer.variables !== 'deny'}
          onClick={() => answer.mutate('deny')}
        >
          Decline
        </Button>
      </div>
    </section>
  );
}
