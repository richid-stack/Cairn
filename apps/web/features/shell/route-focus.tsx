'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * After a link changes the page, move focus to the main area. Without this a keyboard or
 * screen reader user is left on the link they pressed, in the sidebar, with no sign anything
 * changed. It does nothing on the first load.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
