import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/index.js';
import { expectNoA11yViolations } from './setup.js';

describe('Button', () => {
  it('is a plain button that does not submit forms by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('type', 'button');
  });

  it('calls onClick with the mouse and with Enter and Space', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does nothing when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('while loading: announces it, ignores clicks, and stays focusable', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Saving/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Saving');
    button.focus();
    expect(document.activeElement).toBe(button);
    await user.click(button);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes variant and size for styling', () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.dataset.variant).toBe('danger');
    expect(button.dataset.size).toBe('lg');
  });

  it('hides a decorative icon from screen readers', () => {
    render(<Button icon={<svg data-testid="icon" />}>Add</Button>);
    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'has no accessibility violations as %s, normal, disabled and loading',
    async (variant) => {
      const { container } = render(
        <div>
          <Button variant={variant}>Normal</Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Loading
          </Button>
        </div>,
      );
      await expectNoA11yViolations(container);
    },
  );
});
