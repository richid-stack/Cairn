'use client';

import type { ComponentProps } from 'react';
import { cx } from './cx';
import { useUiStrings } from './i18n';
import { VisuallyHidden } from './visually-hidden';

export interface SpinnerProps extends ComponentProps<'span'> {
  /** What is loading, announced to screen readers. */
  label?: string;
}

export function Spinner({ label, className, ...props }: SpinnerProps) {
  const strings = useUiStrings();
  return (
    <span role="status" className={cx('cairn-spinner', className)} {...props}>
      <span className="cairn-spinner-ring" aria-hidden="true" />
      <VisuallyHidden>{label ?? strings.loading}</VisuallyHidden>
    </span>
  );
}
