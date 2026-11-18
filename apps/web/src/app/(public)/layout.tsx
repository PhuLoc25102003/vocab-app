import type { ReactNode } from 'react';
import { Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-6 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SessionLink
              variant="secondary"
              guest={{ href: '/login', label: 'Đăng nhập' }}
              member={{ href: '/dashboard', label: 'Về trang của tôi' }}
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
