import { Suspense, type ReactNode } from 'react';
import { AppNav, AppNavFallback } from '@/components/common/app-nav';
import { Logo } from '@/components/common/logo';
import { LanguageToggle } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AuthGate, AuthGateLoading } from '@/features/auth/components/auth-gate';
import { SignedIn } from '@/features/auth/components/signed-in';
import { OfflineSync } from '@/features/study/components/offline-sync';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { getT } from '@/lib/i18n/server';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const t = await getT('common');
  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3"
      >
        {t('nav.skipToContent')}
      </a>
      <div className="sticky top-3 z-20 mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8">
        <header className="glass-overlay flex min-h-14 w-full items-center gap-4 rounded-full border border-border px-3.5 sm:px-5">
          <Logo href="/dashboard" />
          <div className="hidden md:flex">
            <Suspense fallback={<AppNavFallback />}>
              <AppNav />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <SignedIn>
              <NotificationBell />
            </SignedIn>
            <AccountMenu />
          </div>
        </header>
      </div>
      <div className="md:hidden">
        <Suspense fallback={<AppNavFallback />}>
          <AppNav />
        </Suspense>
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-8 md:px-6 lg:px-8"
      >
        <Suspense fallback={<AuthGateLoading />}>
          <AuthGate>
            <OfflineSync />
            {children}
          </AuthGate>
        </Suspense>
      </main>
    </div>
  );
}
