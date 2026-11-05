'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Every string the design system speaks by itself, such as a screen reader label. Anything a
 * screen writes (button text, errors, headings) belongs to that screen, not to this list.
 */
export interface UiStrings {
  /** Spinners and skeleton groups. */
  loading: string;
  /** The close button on a toast. */
  dismiss: string;
  /** The close button on a dialog or drawer. */
  close: string;
  /** Written tone before a toast message, so meaning never depends on color alone. */
  toastNote: string;
  toastDone: string;
  toastProblem: string;
}

export const defaultStrings: UiStrings = {
  loading: 'Loading',
  dismiss: 'Dismiss',
  close: 'Close',
  toastNote: 'Note',
  toastDone: 'Done',
  toastProblem: 'Problem',
};

const UiContext = createContext<UiStrings>(defaultStrings);

/** Supplies translated strings. Anything left out falls back to English. */
export function UiProvider({
  strings,
  children,
}: {
  strings?: Partial<UiStrings>;
  children: ReactNode;
}) {
  return (
    <UiContext.Provider value={{ ...defaultStrings, ...strings }}>{children}</UiContext.Provider>
  );
}

export function useUiStrings(): UiStrings {
  return useContext(UiContext);
}
