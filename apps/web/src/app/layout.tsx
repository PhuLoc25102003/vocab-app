import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro, Lexend } from 'next/font/google';
import { Providers } from '@/components/common/providers';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'Vocab App',
  description: 'Ôn từ vựng bằng flashcard cho học sinh',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${lexend.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
