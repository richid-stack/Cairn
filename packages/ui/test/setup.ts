import axe from 'axe-core';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

afterEach(() => cleanup());

/**
 * Fails the test on any accessibility violation axe can find in jsdom.
 * Color contrast needs real rendering, so it is covered by the token tests instead.
 */
export async function expectNoA11yViolations(container: Element) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  const summary = result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
  expect(summary, summary.join('\n')).toEqual([]);
}
