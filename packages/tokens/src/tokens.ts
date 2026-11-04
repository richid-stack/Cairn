/**
 * Cairn design tokens.
 *
 * The two brand colors are measured from the logo image (median of the stone and wordmark
 * pixels), so they are within a few levels of the original. Replace them with the exact values
 * once the vector logo is available; everything else is derived or chosen for Cairn.
 *
 * Nothing here is copied from another product. Radii, type scale and neutrals are our own.
 */
export const brand = {
  blue: '#3156EC',
  ink: '#111216',
} as const;

export interface Palette {
  bg: string;
  surface: string;
  border: string;
  borderStrong: string;
  /** Outline of form controls (inputs, checkboxes, switches). At least 3:1 against the page. */
  control: string;
  focus: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  onAccent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
}

export const light: Palette = {
  bg: '#FFFFFF',
  surface: '#F6F7F9',
  border: '#E3E5EA',
  borderStrong: '#C9CDD6',
  control: '#767C8A',
  focus: '#2745C8',
  text: brand.ink,
  textMuted: '#4A4F5C',
  textSubtle: '#656A78',
  accent: brand.blue,
  accentHover: '#2745C8',
  onAccent: '#FFFFFF',
  accentSoft: '#E9EEFE',
  success: '#17794A',
  warning: '#8A5A00',
  danger: '#C42B38',
};

export const dark: Palette = {
  bg: '#0C0D10',
  surface: '#14161A',
  border: '#272A31',
  borderStrong: '#3A3E48',
  control: '#7A808E',
  focus: '#A5B8FF',
  text: '#F4F5F7',
  textMuted: '#B6BAC5',
  textSubtle: '#8E93A1',
  accent: '#8AA2FF',
  accentHover: '#A5B8FF',
  onAccent: '#0C0D10',
  accentSoft: '#1B2447',
  success: '#4CC38A',
  warning: '#E2B24C',
  danger: '#FF7B86',
};

/**
 * High contrast: every text role reaches 7:1, borders reach 3:1, and the focus ring is a
 * color that stands out from both the page and the accent. Used when the user picks it, and
 * automatically when the system asks for more contrast.
 */
export const highContrast: Palette = {
  bg: '#000000',
  surface: '#0A0A0A',
  border: '#9A9A9A',
  borderStrong: '#FFFFFF',
  control: '#FFFFFF',
  focus: '#FFE14D',
  text: '#FFFFFF',
  textMuted: '#E6E6E6',
  textSubtle: '#CFCFCF',
  accent: '#7FB0FF',
  accentHover: '#A9C9FF',
  onAccent: '#000000',
  accentSoft: '#10233F',
  success: '#5CE59A',
  warning: '#FFD166',
  danger: '#FF8A8A',
};

/** px values; the CSS output converts them. */
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;

/** A 4 px grid. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Sizes in px with a line height. The typeface is chosen in Phase 1; these are system fallbacks. */
export const type = {
  xs: { size: 12, line: 16 },
  sm: { size: 14, line: 20 },
  md: { size: 16, line: 24 },
  lg: { size: 18, line: 26 },
  xl: { size: 22, line: 30 },
  '2xl': { size: 28, line: 36 },
  '3xl': { size: 36, line: 44 },
} as const;

export const font = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as const;

/** Milliseconds. Interactions respond in under 100 ms; everything else eases. */
export const motion = {
  instant: 90,
  quick: 160,
  base: 240,
  slow: 360,
  /** Movement within the screen. */
  ease: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Things arriving: fast start, soft landing. */
  easeEnter: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Things leaving: gentle start, quick finish. */
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;
