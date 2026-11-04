'use client';

import { useEffect, useId, useRef, type ComponentProps } from 'react';
import { cx } from './cx';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'size'> {
  /** Always required: a checkbox without a visible label fails accessibility. */
  label: string;
  hint?: string;
  error?: string;
  /** Shows the mixed state, for a parent whose children are partly selected. */
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  hint,
  error,
  indeterminate = false,
  id,
  className,
  ...props
}: CheckboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={cx('cairn-choice', className)} data-invalid={error ? true : undefined}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="cairn-checkbox"
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      <label className="cairn-choice-label" htmlFor={inputId}>
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="cairn-field-hint cairn-choice-note">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="cairn-field-error cairn-choice-note">
          {error}
        </p>
      ) : null}
    </div>
  );
}
