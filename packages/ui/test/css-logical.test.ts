import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/ui.css', import.meta.url), 'utf8');

describe('right-to-left safety', () => {
  it('uses no physical left or right unless the line says why', () => {
    const lines = css.split('\n');
    const physical = /\b(left|right)\b|(margin|padding|border)-(left|right)/;
    const offenders = lines.flatMap((raw, i) => {
      const code = raw.replace(/\/\*.*?\*\//g, '');
      const excused = raw.includes('physical-ok') || lines[i - 1]?.includes('physical-ok');
      return physical.test(code) && !excused ? [`line ${i + 1}: ${raw.trim()}`] : [];
    });
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('flips horizontal motion with the direction variable', () => {
    expect(css).toContain('--cairn-dir: -1');
    expect(css).toContain('var(--cairn-dir)');
  });

  it('mirrors directional icons', () => {
    expect(css).toMatch(/\[dir='rtl'\] \.cairn-icon\[data-directional\]/);
  });
});
