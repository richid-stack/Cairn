import { describe, expect, it } from 'vitest';
import { isThemeId, readStoredTheme, themeInitScript, themes, themeStorageKey } from '../src/index';

describe('theme helpers', () => {
  it('falls back to system for missing, unknown or blocked storage', () => {
    expect(readStoredTheme(undefined)).toBe('system');
    expect(readStoredTheme({ getItem: () => 'purple' })).toBe('system');
    expect(
      readStoredTheme({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('system');
  });

  it('returns a saved theme', () => {
    expect(readStoredTheme({ getItem: () => 'high-contrast' })).toBe('high-contrast');
  });

  it('knows every theme id', () => {
    for (const t of themes) expect(isThemeId(t.id)).toBe(true);
    expect(isThemeId('purple')).toBe(false);
  });

  describe('init script', () => {
    const run = (saved: string | null, throws = false) => {
      document.documentElement.removeAttribute('data-theme');
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: {
          getItem: (key: string) => {
            if (throws) throw new Error('blocked');
            return key === themeStorageKey ? saved : null;
          },
        },
      });
      try {
        // The script is plain browser code, so evaluating it here is the real behavior.
        new Function(themeInitScript)();
      } finally {
        if (original) Object.defineProperty(window, 'localStorage', original);
      }
      return document.documentElement.getAttribute('data-theme');
    };

    it('applies a saved theme before paint', () => {
      expect(run('dark')).toBe('dark');
      expect(run('high-contrast')).toBe('high-contrast');
    });

    it('leaves the attribute unset for system, junk or blocked storage', () => {
      expect(run('system')).toBeNull();
      expect(run('purple')).toBeNull();
      expect(run(null)).toBeNull();
      expect(run('dark', true)).toBeNull();
    });
  });
});
