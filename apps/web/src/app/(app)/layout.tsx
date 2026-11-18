import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/common/app-nav';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { AuthGate } from '@/features/auth/components/auth-gate';
import { LogoutButton } from '@/features/auth/components/logout-button';

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
          <Link href="/dashboard" className="flex min-h-11 items-center font-card text-h3">
            Vocab
          </Link>
          <AppNav />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-8 md:px-6 lg:px-8"
      >
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
