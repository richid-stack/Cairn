'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cx } from './cx';
import { Spinner } from './spinner';

import type { ButtonSize, ButtonVariant } from './button-style';

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and ignores clicks, while keeping the button the same width. */
  loading?: boolean;
  /** Announced to screen readers while loading. */
  loadingLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  icon,
  type = 'button',
  disabled,
  className,
  onClick,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('cairn-button', className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      // A loading button stays focusable so keyboard users do not lose their place.
      disabled={disabled}
      aria-disabled={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {loading ? (
        <Spinner label={loadingLabel} />
      ) : icon ? (
        <span className="cairn-button-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="cairn-button-label" data-hidden={loading || undefined}>
        {children}
      </span>
    </button>
  );
}
