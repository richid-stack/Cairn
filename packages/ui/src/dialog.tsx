'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button';
import { useUiStrings } from './i18n';
import { Icon } from './icon';

export interface DialogProps {
  open: boolean;
  /** Called for Escape, the close button and a click on the backdrop. */
  onClose: () => void;
  /** Always required: names the dialog for screen readers. */
  title: string;
  children: ReactNode;
  /** Buttons for the bottom row. */
  actions?: ReactNode;
  /**
   * Where it appears. A drawer slides in from the start edge (the left in English, the right in
   * Arabic) or the end edge, and fills the height of the screen. Used for the phone menu.
   */
  placement?: 'center' | 'start' | 'end';
}

/**
 * Built on the native dialog element: the browser traps focus, makes the page behind
 * inert, closes on Escape and returns focus to the button that opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  placement = 'center',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const strings = useUiStrings();
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
      data-placement={placement}
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
        <div className="cairn-dialog-header">
          <h2 id={titleId} className="cairn-dialog-title">
            {title}
          </h2>
          <Button variant="ghost" size="sm" aria-label={strings.close} onClick={onClose}>
            <Icon name="close" size="sm" />
          </Button>
        </div>
        <div className="cairn-dialog-content">{children}</div>
        {actions ? <div className="cairn-dialog-actions">{actions}</div> : null}
      </div>
    </dialog>
  );
}
