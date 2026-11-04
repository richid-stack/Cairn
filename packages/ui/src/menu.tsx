'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, type ButtonVariant } from './button';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  /** For actions that delete or cannot be undone. */
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  /** The visible text on the button that opens the menu. */
  label: string;
  items: MenuItem[];
  variant?: ButtonVariant;
}

/**
 * A button that opens a list of actions. Arrow keys, Home, End and typing a letter move
 * through the items, Escape closes and returns focus to the button, Tab closes.
 */
export function Menu({ label, items, variant = 'secondary' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<'below' | 'above'>('below');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const enabled = () => items.flatMap((item, i) => (item.disabled ? [] : [i]));

  function focusItem(index: number | undefined) {
    if (index !== undefined) itemRefs.current[index]?.focus();
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // Open upward when the list would run off the bottom and there is more room above.
  useLayoutEffect(() => {
    if (!open) return;
    const list = rootRef.current?.querySelector('[role="menu"]');
    const trigger = triggerRef.current;
    if (!list || !trigger) return;
    const need = list.getBoundingClientRect().height;
    const below = window.innerHeight - trigger.getBoundingClientRect().bottom;
    const above = trigger.getBoundingClientRect().top;
    setPlacement(need > below && above > below ? 'above' : 'below');
  }, [open]);

  // Opening the menu moves focus to its first item.
  useEffect(() => {
    if (open) focusItem(enabled()[0]);
  }, [open]);

  // A press anywhere outside closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = enabled();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const at = list.indexOf(current);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(list[(at + 1) % list.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(list[(at - 1 + list.length) % list.length]);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(list[0]);
        break;
      case 'End':
        event.preventDefault();
        focusItem(list[list.length - 1]);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
      default: {
        // Typing a letter jumps to the next item that starts with it.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const letter = event.key.toLowerCase();
          const ordered = [...list.slice(at + 1), ...list.slice(0, at + 1)];
          focusItem(ordered.find((i) => items[i]?.label.toLowerCase().startsWith(letter)));
        }
      }
    }
  }

  return (
    <div className="cairn-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        variant={variant}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="cairn-menu-list"
          data-placement={placement}
          onKeyDown={onMenuKeyDown}
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              data-danger={item.danger || undefined}
              className="cairn-menu-item"
              onClick={() => {
                if (item.disabled) return;
                close(true);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
