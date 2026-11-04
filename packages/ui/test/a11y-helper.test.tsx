import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from './setup.js';

describe('the accessibility check itself', () => {
  it('fails on an input with no label, so a passing result means something', async () => {
    const { container } = render(<input />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
  });
});
