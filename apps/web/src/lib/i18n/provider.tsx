'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n, type Locale, toLocale } from './config';

/** Root layout truyền ngôn ngữ đọc từ cookie, để lần render đầu ở client khớp với server. */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [i18n] = useState(() => createI18n(locale));

  useEffect(() => {
    const handleLang = (lng: string) => {
      document.documentElement.lang = toLocale(lng);
    };
    i18n.on('languageChanged', handleLang);
    return () => {
      i18n.off('languageChanged', handleLang);
    };
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
