import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox, Switch } from '../src/index';
import { expectNoA11yViolations } from './setup';

describe('Checkbox', () => {
  it('toggles from its label and from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Ask before spending" />);
    const box = screen.getByRole('checkbox', { name: 'Ask before spending' });
    await user.click(screen.getByText('Ask before spending'));
    expect((box as HTMLInputElement).checked).toBe(true);
    box.focus();
    await user.keyboard(' ');
    expect((box as HTMLInputElement).checked).toBe(false);
  });

  it('shows the mixed state through the indeterminate property', () => {
    render(<Checkbox label="All connectors" indeterminate />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });

  it('wires hint and error to the input', () => {
    render(<Checkbox label="Terms" hint="Short version." error="Tick this to go on." />);
    const box = screen.getByRole('checkbox');
    const described = box.getAttribute('aria-describedby') ?? '';
    expect(described.split(' ')).toHaveLength(2);
    expect(box.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Checkbox label="Remember me" hint="On this device only." />);
    await expectNoA11yViolations(container);
  });
});

describe('Switch', () => {
  it('has the switch role and flips on click and Space', async () => {
    const user = userEvent.setup();
    render(<Switch label="Daily summary" />);
    const toggle = screen.getByRole('switch', { name: 'Daily summary' }) as HTMLInputElement;
    await user.click(toggle);
    expect(toggle.checked).toBe(true);
    await user.keyboard(' ');
    expect(toggle.checked).toBe(false);
  });

  it('does not change while disabled', async () => {
    render(<Switch label="Locked" disabled />);
    await userEvent.setup().click(screen.getByRole('switch'));
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Switch label="Notifications" hint="Quiet hours apply." />);
    await expectNoA11yViolations(container);
  });
});
