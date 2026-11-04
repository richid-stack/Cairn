'use client';

import { useId, type ComponentProps } from 'react';
import { cx } from './cx';

export interface SwitchProps extends Omit<ComponentProps<'input'>, 'type' | 'size' | 'role'> {
  /** Always required: a switch without a visible label fails accessibility. */
  label: string;
  hint?: string;
}

/** A native checkbox with the switch role, so keyboard and screen readers work for free. */
export function Switch({ label, hint, id, className, ...props }: SwitchProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cx('cairn-choice', className)}>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        className="cairn-switch"
        aria-describedby={hintId}
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
    </div>
  );
}
