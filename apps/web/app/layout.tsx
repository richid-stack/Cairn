import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider, themeInitScript } from '@cairn/ui';
import { LocaleProvider } from './locale';
import { Providers } from './providers';
import '@cairn/tokens/tokens.css';
import '@cairn/ui/ui.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Cairn', template: '%s · Cairn' },
  description: 'A personal agent that asks before it acts.',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script sets data-theme before first paint, so React must not flag the difference.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <LocaleProvider>
          <ToastProvider>
            <Providers>{children}</Providers>
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
