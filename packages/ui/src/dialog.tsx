'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  /** Called for Escape, the close button and a click on the backdrop. */
  onClose: () => void;
  /** Always required: names the dialog for screen readers. */
  title: string;
  children: ReactNode;
  /** Buttons for the bottom row. */
  actions?: ReactNode;
}

/**
 * Built on the native dialog element: the browser traps focus, makes the page behind
 * inert, closes on Escape and returns focus to the button that opened it.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Set when the parent closed the dialog, so the native close event is not reported back as a dismissal.
  const closedByParent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      if (typeof el.close === 'function') {
        closedByParent.current = true;
        el.close();
      } else el.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="cairn-dialog"
      aria-labelledby={titleId}
      onClose={() => {
        if (closedByParent.current) closedByParent.current = false;
        else onClose();
      }}
      onCancel={(event) => {
        // Let the parent own the open state: stop the browser closing it behind React's back.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="cairn-dialog-body">
        <h2 id={titleId} className="cairn-dialog-title">
          {title}
        </h2>
        <div className="cairn-dialog-content">{children}</div>
        {actions ? <div className="cairn-dialog-actions">{actions}</div> : null}
      </div>
    </dialog>
  );
}
