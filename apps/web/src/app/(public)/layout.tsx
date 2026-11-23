import type { ReactNode } from 'react';
import { Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { LanguageToggle } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { getT } from '@/lib/i18n/server';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const t = await getT('common');
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-6 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <SessionLink
              variant="secondary"
              guest={{ href: '/login', label: t('session.login') }}
              member={{ href: '/dashboard', label: t('session.myPage') }}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
