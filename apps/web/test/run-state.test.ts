// @vitest-environment node
import type { CairnEvent } from '@cairn/contract/client';
import { describe, expect, it } from 'vitest';
import { applyEvent, initialRunView } from '../features/threads/run-state';
import { titleFrom } from '../features/threads/use-send';
import { riskLabel } from '../features/threads/approval-card';

let n = 0;
function event(type: CairnEvent['type'], data: unknown, id = String(++n)): CairnEvent {
  return { id, type, threadId: 'thr_1', at: '2026-01-01T00:00:00Z', data } as CairnEvent;
}
const run = (events: CairnEvent[]) => events.reduce(applyEvent, initialRunView);

describe('applyEvent', () => {
  it('builds a reply from deltas and clears it when the message completes', () => {
    n = 0;
    const message = {
      id: 'm1',
      threadId: 'thr_1',
      role: 'agent',
      text: 'Hi there',
      createdAt: 'x',
    };
    const mid = run([
      event('run.started', { runId: 'r1' }),
      event('message.delta', { messageId: 'm1', text: 'Hi' }),
      event('message.delta', { messageId: 'm1', text: ' there' }),
    ]);
    expect(mid.phase).toBe('running');
    expect(mid.drafts).toEqual([{ messageId: 'm1', text: 'Hi there' }]);
    const done = applyEvent(mid, event('message.complete', { message }));
    expect(done.drafts).toEqual([]);
    expect(applyEvent(done, event('run.completed', { runId: 'r1' })).phase).toBe('idle');
  });

  it('never repeats text when events are replayed', () => {
    n = 0;
    const events = [
      event('run.started', { runId: 'r1' }),
      event('message.delta', { messageId: 'm1', text: 'Hello' }),
      event('message.delta', { messageId: 'm1', text: ' world' }),
    ];
    const once = run(events);
    const twice = events.reduce(applyEvent, once);
    expect(twice).toBe(once);
    // A reconnect that starts a little early repeats only the tail.
    const overlap = [events[1]!, events[2]!].reduce(applyEvent, run([events[0]!, events[1]!]));
    expect(overlap.drafts[0]!.text).toBe('Hello world');
  });

  it('tracks steps, updating one in place', () => {
    n = 0;
    const view = run([
      event('run.started', { runId: 'r1' }),
      event('run.step', {
        runId: 'r1',
        step: { id: 's1', kind: 'tool', title: 'Look', status: 'running' },
      }),
      event('run.step', {
        runId: 'r1',
        step: { id: 's1', kind: 'tool', title: 'Look', status: 'succeeded' },
      }),
    ]);
    expect(view.steps).toEqual([{ id: 's1', kind: 'tool', title: 'Look', status: 'succeeded' }]);
  });

  it('waits on an approval and goes on after it is answered', () => {
    n = 0;
    const approval = {
      id: 'a1',
      runId: 'r1',
      summary: 'Send it',
      risk: 2,
      status: 'pending',
      answeredAt: null,
    };
    const waiting = run([
      event('run.started', { runId: 'r1' }),
      event('run.waiting_approval', { runId: 'r1', approval }),
    ]);
    expect(waiting.phase).toBe('waiting');
    expect(waiting.approval?.id).toBe('a1');
    const resumed = applyEvent(waiting, event('run.resumed', { runId: 'r1' }));
    expect(resumed.phase).toBe('running');
    expect(resumed.approval).toBeNull();
  });

  it('reports a failure with what to do about it, and drops half a reply', () => {
    n = 0;
    const view = run([
      event('run.started', { runId: 'r1' }),
      event('message.delta', { messageId: 'm1', text: 'Partial' }),
      event('run.failed', {
        runId: 'r1',
        message: 'The model key was rejected.',
        fix: 'Check the key in Settings.',
      }),
    ]);
    expect(view.phase).toBe('failed');
    expect(view.failure).toEqual({
      message: 'The model key was rejected.',
      fix: 'Check the key in Settings.',
    });
    expect(view.drafts).toEqual([]);
  });

  it('starts a new run clean', () => {
    n = 0;
    const view = run([
      event('run.started', { runId: 'r1' }),
      event('run.step', {
        runId: 'r1',
        step: { id: 's1', kind: 'tool', title: 'Old', status: 'succeeded' },
      }),
      event('run.completed', { runId: 'r1' }),
      event('run.started', { runId: 'r2' }),
    ]);
    expect(view.steps).toEqual([]);
    expect(view.runId).toBe('r2');
  });
});

describe('titleFrom', () => {
  it('uses the first line and keeps it short', () => {
    expect(titleFrom('  Plan my week\nwith details ')).toBe('Plan my week');
    expect(titleFrom('x'.repeat(100))).toHaveLength(60);
    expect(titleFrom('   ')).toBe('New conversation');
  });
});

describe('riskLabel', () => {
  it('always has words, and stays in range', () => {
    expect(riskLabel(0)).toBe('Just reading');
    expect(riskLabel(2)).toBe('Medium risk');
    expect(riskLabel(9)).toBe('Very high risk');
    expect(riskLabel(-3)).toBe('Just reading');
  });
});
