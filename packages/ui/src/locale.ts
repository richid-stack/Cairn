export type TextDirection = 'ltr' | 'rtl';

// Languages written right to left. Kept as a plain list because Intl.Locale text info is not
// available in every browser yet.
const rtlLanguages = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb', 'ku']);

/** "ar-EG" and "ar" are right to left; "en-GB" is left to right. Unknown or empty is left to right. */
export function directionOf(locale: string | undefined | null): TextDirection {
  const language = (locale ?? '').toLowerCase().split(/[-_]/)[0] ?? '';
  return rtlLanguages.has(language) ? 'rtl' : 'ltr';
}
