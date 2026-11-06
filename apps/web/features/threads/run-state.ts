import type { Approval, CairnEvent, Step } from '@cairn/contract/client';

/** A reply that is still arriving. It becomes a normal message when `message.complete` comes. */
export interface Draft {
  messageId: string;
  text: string;
}

export interface RunView {
  /**
   * idle: nothing is happening. running: the agent is working. waiting: it needs an answer
   * from you. failed and cancelled: the last run ended without finishing.
   */
  phase: 'idle' | 'running' | 'waiting' | 'failed' | 'cancelled';
  runId: string | null;
  /** The newest plain-language status line, such as "Reading your request". */
  status: string | null;
  steps: Step[];
  approval: Approval | null;
  failure: { message: string; fix?: string } | null;
  drafts: Draft[];
  /** The highest event id applied. Sent as Last-Event-ID when the connection is reopened. */
  lastEventId: number;
}

export const initialRunView: RunView = {
  phase: 'idle',
  runId: null,
  status: null,
  steps: [],
  approval: null,
  failure: null,
  drafts: [],
  lastEventId: 0,
};

/**
 * Applies one event. It is safe to replay: an event at or below `lastEventId` changes nothing,
 * so a reconnect that repeats a few events never repeats text. Unknown event types are
 * ignored, because later phases add more.
 */
export function applyEvent(state: RunView, event: CairnEvent): RunView {
  const id = Number(event.id);
  if (Number.isFinite(id) && id <= state.lastEventId) return state;
  const next: RunView = Number.isFinite(id) ? { ...state, lastEventId: id } : { ...state };

  switch (event.type) {
    case 'run.started':
      return {
        ...next,
        phase: 'running',
        runId: event.data?.runId ?? null,
        status: null,
        steps: [],
        approval: null,
        failure: null,
      };
    case 'status.update':
      return { ...next, status: event.data?.text ?? null };
    case 'run.step': {
      const step = event.data?.step;
      if (!step) return next;
      const at = next.steps.findIndex((s) => s.id === step.id);
      const steps = at === -1 ? [...next.steps, step] : next.steps.with(at, step);
      return { ...next, steps };
    }
    case 'message.delta': {
      const data = event.data;
      if (!data) return next;
      const at = next.drafts.findIndex((d) => d.messageId === data.messageId);
      const drafts =
        at === -1
          ? [...next.drafts, { messageId: data.messageId, text: data.text }]
          : next.drafts.with(at, {
              messageId: data.messageId,
              text: next.drafts[at]!.text + data.text,
            });
      return { ...next, drafts };
    }
    case 'message.complete': {
      const messageId = event.data?.message.id;
      return { ...next, drafts: next.drafts.filter((d) => d.messageId !== messageId) };
    }
    case 'run.waiting_approval':
      return {
        ...next,
        phase: 'waiting',
        runId: event.data?.runId ?? next.runId,
        approval: event.data?.approval ?? null,
      };
    case 'run.resumed':
      return { ...next, phase: 'running', approval: null };
    case 'run.completed':
      return { ...next, phase: 'idle', status: null, approval: null };
    case 'run.failed': {
      const failure: { message: string; fix?: string } = {
        message: event.data?.message ?? 'Something went wrong.',
      };
      if (event.data?.fix) failure.fix = event.data.fix;
      return { ...next, phase: 'failed', status: null, approval: null, failure, drafts: [] };
    }
    case 'run.cancelled':
      return { ...next, phase: 'cancelled', status: null, approval: null, drafts: [] };
    default:
      return next;
  }
}

/** True when the connection should be reopened after it ends: the agent is still working. */
export function expectsMoreEvents(state: RunView): boolean {
  return state.phase === 'running';
}

/** The events a stream reply should add to the message list. */
export function completedMessage(event: CairnEvent) {
  return event.type === 'message.complete' ? (event.data?.message ?? null) : null;
}
