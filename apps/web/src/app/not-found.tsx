import type { Metadata } from 'next';
import { EmptyState } from '@/components/common/empty-state';
import { Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { LanguageToggle } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.notFoundTitle'), robots: { index: false } };
}

export default async function NotFound() {
  const t = await getT('common');
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-2 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-8 md:px-6 lg:px-8">
        <EmptyState
          title={t('pages.notFoundTitle')}
          description={t('pages.notFoundDesc')}
          action={
            <SessionLink
              variant="secondary"
              guest={{ href: '/', label: t('session.home') }}
              member={{ href: '/dashboard', label: t('session.myPage') }}
            />
          }
        />
      </main>
    </div>
  );
}
