'use client';

import { Button } from '@cairn/ui';
import { useEffect, useState } from 'react';

const themes = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'high-contrast', label: 'High contrast' },
] as const;

type ThemeId = (typeof themes)[number]['id'];
const storageKey = 'cairn-theme';

function readStored(): ThemeId {
  try {
    const value = window.localStorage.getItem(storageKey);
    return themes.some((t) => t.id === value) ? (value as ThemeId) : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>('system');

  useEffect(() => setTheme(readStored()), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Storage can be blocked; the choice then lasts only for this visit.
    }
  }, [theme]);

  return (
    <div role="group" aria-label="Theme" className="row">
      {themes.map((t) => (
        <Button
          key={t.id}
          size="sm"
          variant={theme === t.id ? 'primary' : 'secondary'}
          aria-pressed={theme === t.id}
          onClick={() => setTheme(t.id)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}
