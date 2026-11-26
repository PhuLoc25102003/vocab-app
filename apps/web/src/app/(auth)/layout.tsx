import type { ReactNode } from 'react';
import { Logo } from '@/components/common/logo';
import { LanguageToggle } from '@/components/common/language-switcher';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-3 z-20 mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8">
        <header className="glass-overlay flex min-h-14 w-full items-center justify-between gap-4 rounded-full border border-border px-3.5 sm:px-5">
          <Logo href="/" />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
      </div>
      <main className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className="glass-surface flex w-full max-w-[460px] flex-col gap-6 rounded-2xl border border-border p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
