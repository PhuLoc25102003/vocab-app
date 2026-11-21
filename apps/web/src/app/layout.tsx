import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';
import { Be_Vietnam_Pro, Literata, Noto_Serif } from 'next/font/google';
import { BRAND_NAME } from '@/components/common/logo';
import { Providers } from '@/components/common/providers';
import { ServiceWorkerRegistration } from '@/components/common/service-worker';
import { BRAND_COLORS } from '@/lib/brand';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/provider';
import { getLocale } from '@/lib/i18n/server';
import { themeInitScript } from '@/lib/theme';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

const literata = Literata({
  variable: '--font-literata',
  subsets: ['latin', 'vietnamese'],
});

// Phiên âm IPA chỉ cần khi thẻ có phiên âm nên không preload.
const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin', 'latin-ext', 'greek'],
  weight: '400',
  preload: false,
});

export const viewport: Viewport = { themeColor: BRAND_COLORS.primary };

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: 'Ôn từ vựng bằng flashcard cho học sinh',
};

/**
 * Đọc cookie ngôn ngữ trong `Suspense` vì `cacheComponents` không cho đọc dữ liệu runtime ngoài
 * ranh giới đó. `<html lang>` tĩnh là `vi`; script chạy ngay khi phần này tới trình duyệt để đổi
 * sang ngôn ngữ trong cookie trước khi React hydrate (ADR 0003).
 */
async function LocaleRoot({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <>
      {locale === DEFAULT_LOCALE ? null : (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
          }}
        />
      )}
      <I18nProvider locale={locale}>
        <Providers>{children}</Providers>
      </I18nProvider>
    </>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${beVietnamPro.variable} ${literata.variable} ${notoSerif.variable} h-full antialiased`}
      // Script bên dưới đổi class của <html> trước khi React hydrate.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={null}>
          <LocaleRoot>{children}</LocaleRoot>
        </Suspense>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
