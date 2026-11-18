import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro, Literata, Noto_Serif } from 'next/font/google';
import { Providers } from '@/components/common/providers';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

const literata = Literata({
  variable: '--font-literata',
  subsets: ['latin', 'vietnamese'],
  axes: ['opsz'],
});

// Phiên âm IPA chỉ cần khi thẻ có phiên âm nên không preload.
const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin', 'latin-ext', 'greek'],
  weight: '400',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Vocab App',
  description: 'Ôn từ vựng bằng flashcard cho học sinh',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${literata.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
