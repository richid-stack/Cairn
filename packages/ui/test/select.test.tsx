import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select } from '../src/index';
import { expectNoA11yViolations } from './setup';

const options = (
  <>
    <option value="gh">Ghana</option>
    <option value="ke">Kenya</option>
  </>
);

describe('Select', () => {
  it('connects the label and changes value', async () => {
    render(<Select label="Country">{options}</Select>);
    await userEvent.setup().selectOptions(screen.getByLabelText('Country'), 'ke');
    expect((screen.getByLabelText('Country') as HTMLSelectElement).value).toBe('ke');
  });

  it('wires hint and error', () => {
    render(
      <Select label="Country" hint="Where you live." error="Pick one.">
        {options}
      </Select>,
    );
    const select = screen.getByLabelText('Country');
    expect((select.getAttribute('aria-describedby') ?? '').split(' ')).toHaveLength(2);
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Select label="Country" hint="Where you live.">
        {options}
      </Select>,
    );
    await expectNoA11yViolations(container);
  });
});
