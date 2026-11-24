'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND_NAME, Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { LanguageToggle } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { useTranslation } from 'react-i18next';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'legal.privacy' },
  { href: '/terms', label: 'legal.terms' },
] as const;

/** Khung chung của các trang công khai: logo, đổi giao diện, đăng nhập và link pháp lý. */
export function MarketingShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('marketing');
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-2 px-3 sm:px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <SessionLink
              variant="secondary"
              guest={{ href: '/login', label: t('shell.login') }}
              member={{ href: '/dashboard', label: t('shell.myPage') }}
            />
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-6 text-small text-text-muted sm:flex-row sm:items-center md:px-6 lg:px-8">
          <span>{BRAND_NAME}</span>
          <nav aria-label={t('legal.nav')} className="flex flex-wrap gap-x-4 sm:ml-auto">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:text-text hover:underline"
              >
                {t(label)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
