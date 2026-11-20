import { Suspense, type ReactNode } from 'react';
import { Logo } from '@/components/common/logo';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AuthGate, AuthGateLoading } from '@/features/auth/components/auth-gate';
import { OfflineSync } from '@/features/study/components/offline-sync';
import { AccountMenu } from '@/features/auth/components/account-menu';
import { RoleNav } from '@/features/auth/components/role-nav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-16 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-20 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3"
      >
        Đến nội dung chính
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-6 px-4 md:px-6 lg:px-8">
          <Logo href="/dashboard" />
          <RoleNav />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </header>
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
