'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n, type Locale, toLocale } from './config';
import { type Messages, vi } from './messages-vi';

/**
 * Root layout truyền ngôn ngữ đọc từ cookie, để lần render đầu ở client khớp với server. Trang mở
 * bằng tiếng Anh thì nhận luôn bộ chuỗi `en`, vì bundle client chỉ có sẵn tiếng Việt.
 */
export function I18nProvider({
  locale,
  en,
  children,
}: {
  locale: Locale;
  en?: Messages;
  children: ReactNode;
}) {
  const [i18n] = useState(() => createI18n(locale, en ? { vi, en } : { vi }));

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
