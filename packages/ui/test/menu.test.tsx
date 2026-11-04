import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from '../src/index';
import { expectNoA11yViolations } from './setup';

function setup(overrides: Partial<Record<string, () => void>> = {}) {
  const calls = { rename: vi.fn(), archive: vi.fn(), remove: vi.fn(), ...overrides };
  const user = userEvent.setup();
  render(
    <main>
      <Menu
        label="Thread actions"
        items={[
          { label: 'Rename', onSelect: calls.rename! },
          { label: 'Archive', onSelect: calls.archive!, disabled: true },
          { label: 'Delete', onSelect: calls.remove!, danger: true },
        ]}
      />
      <button type="button">Elsewhere</button>
    </main>,
  );
  return { user, calls, trigger: () => screen.getByRole('button', { name: 'Thread actions' }) };
}

describe('Menu', () => {
  it('opens on click and focuses the first item', async () => {
    const { user, trigger } = setup();
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
  });

  it('opens with the down arrow from the button', async () => {
    const { user, trigger } = setup();
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('moves with arrows, skips disabled items and wraps', async () => {
    const { user, trigger } = setup();
    await user.click(trigger());
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Delete' }));
  });

  it('jumps to an item by typing its first letter', async () => {
    const { user, trigger } = setup();
    await user.click(trigger());
    await user.keyboard('d');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Delete' }));
  });

  it('closes on Escape and gives focus back to the button', async () => {
    const { user, trigger } = setup();
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('runs the chosen action once, closes and returns focus', async () => {
    const { user, calls, trigger } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(calls.remove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('does not run a disabled item', async () => {
    const { user, calls, trigger } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(calls.archive).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('closes when you press outside', async () => {
    const { user, trigger } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('has no accessibility violations open', async () => {
    const { user, trigger } = setup();
    await user.click(trigger());
    await expectNoA11yViolations(document.body);
  });
});
