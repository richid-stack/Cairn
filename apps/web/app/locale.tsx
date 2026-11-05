'use client';

import { Button, UiProvider, directionOf, type UiStrings } from '@cairn/ui';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const locales = [
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
] as const;
type LocaleId = (typeof locales)[number]['id'];

// Sample strings to prove the layout and the catalogue. A native speaker must review any
// real translation before it ships.
const strings: Record<LocaleId, Partial<UiStrings>> = {
  en: {},
  ar: {
    loading: 'جارٍ التحميل',
    dismiss: 'إغلاق',
    close: 'إغلاق',
    toastNote: 'ملاحظة',
    toastDone: 'تم',
    toastProblem: 'مشكلة',
  },
};

const LocaleContext = createContext<{ locale: LocaleId; setLocale: (l: LocaleId) => void } | null>(
  null,
);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleId>('en');

  // The page language and direction live on the html element, where CSS and screen readers look.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = directionOf(locale);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <UiProvider strings={strings[locale]}>{children}</UiProvider>
    </LocaleContext.Provider>
  );
}

export function LocaleSwitcher() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('LocaleSwitcher must be used inside <LocaleProvider>.');
  return (
    <div role="group" aria-label="Language" className="row">
      {locales.map((l) => (
        <Button
          key={l.id}
          size="sm"
          lang={l.id}
          variant={ctx.locale === l.id ? 'primary' : 'secondary'}
          aria-pressed={ctx.locale === l.id}
          onClick={() => ctx.setLocale(l.id)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
