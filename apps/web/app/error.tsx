'use client';

import { Button } from '@cairn/ui';

// Shown when a screen breaks while drawing itself. The details stay in the console; the person
// gets a way forward.
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <main className="standalone" role="alert">
      <h1 className="page-title">Something broke on this page</h1>
      <p className="page-lede">Your conversations are safe. Trying again often fixes it.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
