'use client';

import { Button, readStoredTheme, themes, themeStorageKey, type ThemeId } from '@cairn/ui';
import { useEffect, useState } from 'react';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>('system');

  // Only reads here. The head script has already applied the saved theme, so writing
  // on mount would undo it and bring the flash back.
  useEffect(() => setTheme(readStoredTheme(window.localStorage)), []);

  function choose(next: ThemeId) {
    setTheme(next);
    const root = document.documentElement;
    if (next === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(themeStorageKey, next);
    } catch {
      // Storage can be blocked; the choice then lasts only for this visit.
    }
  }

  return (
    <div role="group" aria-label="Theme" className="row">
      {themes.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={theme === t.id ? 'primary' : 'secondary'}
          aria-pressed={theme === t.id}
          onClick={() => choose(t.id)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
