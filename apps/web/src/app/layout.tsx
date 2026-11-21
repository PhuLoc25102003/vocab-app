import type { Metadata, Viewport } from 'next';
import { Suspense, type ReactNode } from 'react';
import { Be_Vietnam_Pro, Literata, Noto_Serif } from 'next/font/google';
import { BRAND_NAME } from '@/components/common/logo';
import { Providers } from '@/components/common/providers';
import { ServiceWorkerRegistration } from '@/components/common/service-worker';
import { BRAND_COLORS } from '@/lib/brand';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/provider';
import { getLocale, getT } from '@/lib/i18n/server';
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('marketing');
  return {
    title: BRAND_NAME,
    description: t('hero.eyebrow'),
  };
}

/**
 * Đọc cookie ngôn ngữ trong `Suspense` vì `cacheComponents` không cho đọc dữ liệu runtime ngoài
 * ranh giới đó. `<html lang>` tĩnh là `vi`; `themeInitScript` ở `<head>` và `I18nProvider` đồng bộ
 * sang ngôn ngữ trong cookie trước và sau khi React hydrate (ADR 0003).
 */
async function LocaleRoot({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <I18nProvider locale={locale}>
      <Providers>{children}</Providers>
    </I18nProvider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      translate="no"
      className={`${beVietnamPro.variable} ${literata.variable} ${notoSerif.variable} notranslate h-full antialiased`}
      // Script bên dưới đổi class của <html> trước khi React hydrate.
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
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
