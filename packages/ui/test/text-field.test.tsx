import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../src/index.js';
import { expectNoA11yViolations } from './setup.js';

describe('TextField', () => {
  it('connects the label to the input', async () => {
    render(<TextField label="Email" />);
    await userEvent.setup().type(screen.getByLabelText('Email'), 'ada@example.com');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('ada@example.com');
  });

  it('describes the input with its hint', () => {
    render(<TextField label="Email" hint="We send a sign-in code." />);
    expect(screen.getByLabelText('Email').getAttribute('aria-describedby')).toBe(
      screen.getByText('We send a sign-in code.').id,
    );
  });

  it('marks an error invalid and reads it out with the hint', () => {
    render(
      <TextField
        label="Email"
        hint="Use your work address."
        error="That address is not valid. Check for typos."
      />,
    );
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[1] ?? '')?.textContent).toContain('not valid');
  });

  it('is not invalid when there is no error', () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBeNull();
  });

  it('has no accessibility violations in any state', async () => {
    const { container } = render(
      <div>
        <TextField label="Plain" />
        <TextField label="With hint" hint="Helpful." />
        <TextField label="With error" error="Something to fix." />
        <TextField label="Disabled" disabled />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
