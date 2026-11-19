import type { Metadata } from 'next';
import { EmptyState } from '@/components/common/empty-state';
import { Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { ThemeToggle } from '@/components/common/theme-toggle';

export const metadata: Metadata = { title: 'Không tìm thấy trang', robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-2 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-8 md:px-6 lg:px-8">
        <EmptyState
          title="Không tìm thấy trang"
          description="Đường dẫn này không tồn tại hoặc đã được đổi."
          action={
            <SessionLink
              variant="secondary"
              guest={{ href: '/', label: 'Về trang chủ' }}
              member={{ href: '/dashboard', label: 'Về trang của tôi' }}
            />
          }
        />
      </main>
    </div>
  );
}
