'use client';

import { useId, type ComponentProps } from 'react';
import { cx } from './cx';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  /** Always required: a select without a visible label fails accessibility. */
  label: string;
  hint?: string;
  error?: string;
}

/**
 * A styled native select. The browser supplies the keyboard behavior, the screen reader
 * announcements and, on phones, the system picker, so none of it can break.
 */
export function Select({ label, hint, error, id, className, children, ...props }: SelectProps) {
  const generated = useId();
  const selectId = id ?? generated;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={cx('cairn-field', className)} data-invalid={error ? true : undefined}>
      <label className="cairn-field-label" htmlFor={selectId}>
        {label}
      </label>
      <div className="cairn-select-wrap">
        <select
          id={selectId}
          className="cairn-input cairn-select"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...props}
        >
          {children}
        </select>
      </div>
      {hint ? (
        <p id={hintId} className="cairn-field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="cairn-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
