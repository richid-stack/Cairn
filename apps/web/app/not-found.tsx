import { buttonStyle } from '@cairn/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="standalone">
      <h1 className="page-title">There is nothing at this address</h1>
      <p className="page-lede">The page may have moved, or the address is mistyped.</p>
      <Link href="/chat" {...buttonStyle()}>
        Go to chat
      </Link>
    </main>
  );
}
