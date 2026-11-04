import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@cairn/tokens/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cairn',
  description: 'A personal agent that asks before it acts.',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
