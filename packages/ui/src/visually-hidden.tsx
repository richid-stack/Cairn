import type { ComponentProps } from 'react';
import { cx } from './cx';

/** Text that screen readers announce and sighted users do not see. */
export function VisuallyHidden({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cx('cairn-visually-hidden', className)} {...props} />;
}
