import { describe, expect, it } from 'vitest';
import { contrast } from '../src/contrast.js';
import { buildCss } from '../src/css.js';
import { brand, dark, light, type Palette } from '../src/tokens.js';

const themes: [string, Palette][] = [
  ['light', light],
  ['dark', dark],
];

describe.each(themes)('%s theme contrast', (_name, p) => {
  it('body text is easy to read on both surfaces', () => {
    expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.text, p.surface)).toBeGreaterThanOrEqual(7);
  });

  it('secondary and subtle text meet 4.5:1', () => {
    for (const color of [p.textMuted, p.textSubtle]) {
      expect(contrast(color, p.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(color, p.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('text on the accent color meets 4.5:1, in rest and hover', () => {
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onAccent, p.accentHover)).toBeGreaterThanOrEqual(4.5);
  });

  it('the accent reads as a control against the page (3:1)', () => {
    expect(contrast(p.accent, p.bg)).toBeGreaterThanOrEqual(3);
  });

  it('borders that mark an input are visible (3:1 would be ideal, 1.4:1 is the floor)', () => {
    expect(contrast(p.borderStrong, p.bg)).toBeGreaterThanOrEqual(1.4);
  });

  it('status colors are readable as text', () => {
    for (const color of [p.success, p.warning, p.danger]) {
      expect(contrast(color, p.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('brand', () => {
  it('uses the measured logo colors for the light theme', () => {
    expect(light.accent).toBe(brand.blue);
    expect(light.text).toBe(brand.ink);
  });
});

describe('css output', () => {
  const css = buildCss();

  it('defines both themes and reduced motion', () => {
    expect(css).toContain(":root[data-theme='dark']");
    expect(css).toContain('prefers-color-scheme: dark');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('writes every color token for both themes', () => {
    const count = Object.keys(light).length;
    const matches = css.match(/--cairn-color-bg:/g) ?? [];
    expect(matches.length).toBe(3);
    expect((css.match(/--cairn-color-/g) ?? []).length).toBe(count * 3);
  });
});
