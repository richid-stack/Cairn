import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast, type ToastInput } from '../src/index';
import { expectNoA11yViolations } from './setup';

let api: ReturnType<typeof useToast>;
function Grab() {
  api = useToast();
  return null;
}
const show = (toast: ToastInput) => act(() => void api.show(toast));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  render(
    <ToastProvider>
      <Grab />
    </ToastProvider>,
  );
});
afterEach(() => vi.useRealTimers());

describe('Toast', () => {
  it('announces calm messages politely and problems as alerts', () => {
    show({ message: 'Saved.', tone: 'success' });
    show({ message: 'Could not send.', tone: 'danger' });
    const status = screen.getByRole('status');
    const alert = screen.getByRole('alert');
    expect(status.textContent).toContain('Saved.');
    expect(alert.textContent).toContain('Could not send.');
    expect(status.textContent).not.toContain('Could not send.');
  });

  it('does not rely on color: the tone is also in the text', () => {
    show({ message: 'Could not send.', tone: 'danger' });
    expect(screen.getByRole('alert').textContent).toContain('Problem: Could not send.');
  });

  it('goes away on its own after the duration', () => {
    show({ message: 'Saved.' });
    expect(screen.queryByText('Saved.')).toBeTruthy();
    act(() => void vi.advanceTimersByTime(5_100));
    expect(screen.queryByText('Saved.')).toBeNull();
  });

  it('stays while the pointer is on it, then goes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    show({ message: 'Thread archived.' });
    await user.hover(screen.getByText('Thread archived.'));
    act(() => void vi.advanceTimersByTime(20_000));
    expect(screen.queryByText('Thread archived.')).toBeTruthy();
    await user.unhover(screen.getByText('Thread archived.'));
    act(() => void vi.advanceTimersByTime(5_100));
    expect(screen.queryByText('Thread archived.')).toBeNull();
  });

  it('runs its action once and dismisses', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const undo = vi.fn();
    show({ message: 'Thread archived.', action: { label: 'Undo', onAction: undo } });
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Thread archived.')).toBeNull();
  });

  it('gives actions longer than plain messages', () => {
    show({ message: 'Thread archived.', action: { label: 'Undo', onAction: () => {} } });
    act(() => void vi.advanceTimersByTime(6_000));
    expect(screen.queryByText('Thread archived.')).toBeTruthy();
  });

  it('can be dismissed by hand', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    show({ message: 'Saved.' });
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved.')).toBeNull();
  });

  it('shows at most three at once, dropping the oldest', () => {
    for (const n of [1, 2, 3, 4]) show({ message: `Message ${n}` });
    expect(screen.queryByText('Message 1')).toBeNull();
    expect(screen.queryByText('Message 4')).toBeTruthy();
  });

  it('has no accessibility violations with toasts showing', async () => {
    show({ message: 'Saved.', tone: 'success' });
    show({
      message: 'Could not send.',
      tone: 'danger',
      action: { label: 'Retry', onAction: () => {} },
    });
    await expectNoA11yViolations(document.body);
  });

  it('explains itself if used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
