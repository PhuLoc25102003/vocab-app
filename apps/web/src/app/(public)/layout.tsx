import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-6 px-4 md:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center font-card text-h3">
            Vocab
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="secondary">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
