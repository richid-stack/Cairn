import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { ToastProvider } from '../src/toast';
import { UiProvider, type UiStrings } from '../src/i18n';
import '@fontsource-variable/inter';
import '@cairn/tokens/tokens.css';
import '../src/ui.css';
import './preview.css';

const arabic: Partial<UiStrings> = {
  loading: 'جارٍ التحميل',
  dismiss: 'إغلاق',
  close: 'إغلاق',
  toastNote: 'ملاحظة',
  toastDone: 'تم',
  toastProblem: 'مشكلة',
};

// Theme and direction are Storybook "globals", so a URL such as ?globals=theme:dark;dir:rtl
// renders any story in that setting. The visual and accessibility checks rely on this.
const withCairn: Decorator = (Story, context) => {
  const theme = String(context.globals.theme ?? 'light');
  const dir = String(context.globals.dir ?? 'ltr');
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('dir', dir);
    root.setAttribute('lang', dir === 'rtl' ? 'ar' : 'en');
  }, [theme, dir]);
  return (
    <UiProvider strings={dir === 'rtl' ? arabic : undefined}>
      <ToastProvider>
        <Story />
      </ToastProvider>
    </UiProvider>
  );
};

const preview: Preview = {
  decorators: [withCairn],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'high-contrast', title: 'High contrast' },
        ],
        dynamicTitle: true,
      },
    },
    dir: {
      description: 'Text direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'Left to right' },
          { value: 'rtl', title: 'Right to left' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', dir: 'ltr' },
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'error' },
  },
};

export default preview;
