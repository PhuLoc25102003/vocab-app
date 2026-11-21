'use client';

import { ErrorState } from '@/components/common/error-state';
import { themeInitScript } from '@/lib/theme';
import { LOCALE_COOKIE } from '@/lib/i18n/config';
import viCommon from '@/locales/vi/common.json';
import enCommon from '@/locales/en/common.json';
import { useState } from 'react';
import './globals.css';

/** Thay cả layout gốc khi layout gốc bị lỗi, nên phải tự có `html` và `body`. */
export default function GlobalError({ retry }: { retry: () => void }) {
  const [isEn] = useState(
    () => typeof document !== 'undefined' && document.cookie.includes(`${LOCALE_COOKIE}=en`),
  );

  const dict = isEn ? enCommon.pages : viCommon.pages;
  const title = dict.globalErrorTitle;
  const description = dict.globalErrorDesc;

  return (
    <html lang={isEn ? 'en' : 'vi'} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <title>{title}</title>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-8">
          <ErrorState title={title} description={description} onRetry={retry} />
        </main>
      </body>
    </html>
  );
}
