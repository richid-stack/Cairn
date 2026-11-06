'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** How close to the bottom still counts as "at the bottom", in pixels. */
const threshold = 80;

function atBottom(): boolean {
  const root = document.documentElement;
  return window.innerHeight + window.scrollY >= root.scrollHeight - threshold;
}

/**
 * Keeps the newest text in view while it streams, but only if you were already at the bottom.
 * Scroll up to read and the page stays put; `behind` turns true so a "Jump to latest" button
 * can appear instead of the page moving under you. `signal` is anything that changes when
 * content grows, such as the length of the latest text.
 */
export function useStickToBottom(signal: unknown) {
  const stuck = useRef(true);
  const [behind, setBehind] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      stuck.current = atBottom();
      if (stuck.current) setBehind(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (stuck.current) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
    } else {
      setBehind(true);
    }
  }, [signal]);

  const jump = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stuck.current = true;
    setBehind(false);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, []);

  return { behind, jump };
}
