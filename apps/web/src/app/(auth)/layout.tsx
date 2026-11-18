import type { ReactNode } from 'react';
import { Logo } from '@/components/common/logo';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center justify-between gap-6 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col gap-6 px-4 py-12">
        {children}
      </main>
    </div>
  );
}
