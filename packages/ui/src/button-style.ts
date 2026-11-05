// Plain functions live outside button.tsx, whose "use client" mark would hide them from server pages.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props that make any element, such as a router link, look and size like a Button. Spread them
 * onto an anchor: <Link href="/chat" {...buttonStyle({ variant: 'primary' })}>New chat</Link>.
 * A link goes somewhere and a button does something, so each keeps its own element.
 */
export function buttonStyle({
  variant = 'primary',
  size = 'md',
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return { className: 'cairn-button', 'data-variant': variant, 'data-size': size } as const;
}
