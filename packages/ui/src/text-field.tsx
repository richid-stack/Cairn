'use client';

import { useId, type ComponentProps } from 'react';
import { cx } from './cx';

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  /** Always required: an input without a visible label fails accessibility. */
  label: string;
  hint?: string;
  /** A plain-language error with what to do next. */
  error?: string;
}

export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('cairn-field', className)} data-invalid={error ? true : undefined}>
      <label className="cairn-field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="cairn-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
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
