'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button } from './button';
import { Icon, type IconName } from './icon';
import { VisuallyHidden } from './visually-hidden';

export type ToastTone = 'info' | 'success' | 'danger';

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** A way back, such as Undo. Undo beats "are you sure?" for anything reversible. */
  action?: { label: string; onAction: () => void };
  /** Milliseconds before it goes away. Toasts with an action stay longer by default. */
  duration?: number;
}

interface ToastEntry extends ToastInput {
  id: number;
}

interface ToastApi {
  show: (toast: ToastInput) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const MAX_VISIBLE = 3;

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>.');
  return api;
}

const toneIcon: Record<ToastTone, IconName> = { info: 'info', success: 'success', danger: 'error' };
const toneWord: Record<ToastTone, string> = { info: 'Note', success: 'Done', danger: 'Problem' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((all) => [...all, { ...toast, id }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  // Two regions that exist from the start: screen readers only announce changes inside a
  // live region that was already on the page. Problems interrupt; everything else waits.
  const calm = toasts.filter((t) => t.tone !== 'danger');
  const urgent = toasts.filter((t) => t.tone === 'danger');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="cairn-toast-region">
        <div role="status" aria-live="polite">
          {calm.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
        <div role="alert">
          {urgent.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const tone = toast.tone ?? 'info';
  const duration = toast.duration ?? (toast.action || tone === 'danger' ? 10_000 : 5_000);

  // The timer stops while the pointer or keyboard focus is on the toast, so nobody
  // loses the Undo button while reaching for it.
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [paused, duration, onDismiss, toast.id]);

  return (
    <div
      className="cairn-toast"
      data-tone={tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={toneIcon[tone]} className="cairn-toast-icon" />
      <p className="cairn-toast-message">
        <VisuallyHidden>{toneWord[tone]}: </VisuallyHidden>
        {toast.message}
      </p>
      {toast.action ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            toast.action?.onAction();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
        <Icon name="close" size="sm" />
      </Button>
    </div>
  );
}
