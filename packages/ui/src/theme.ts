export const themes = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'high-contrast', label: 'High contrast' },
] as const;

export type ThemeId = (typeof themes)[number]['id'];

export const themeStorageKey = 'cairn-theme';

export function isThemeId(value: unknown): value is ThemeId {
  return themes.some((t) => t.id === value);
}

/** Reads the saved choice. Storage can be blocked, so this never throws. */
export function readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): ThemeId {
  try {
    const value = storage?.getItem(themeStorageKey);
    return isThemeId(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Inline script for the document head. It runs before first paint so a saved theme
 * never flashes the wrong colors. "system" leaves data-theme unset so the OS decides.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(themeStorageKey)});if(${JSON.stringify(
  themes.filter((x) => x.id !== 'system').map((x) => x.id),
)}.indexOf(t)>-1)document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
