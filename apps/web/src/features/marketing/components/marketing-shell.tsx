import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND_NAME, Logo } from '@/components/common/logo';
import { SessionLink } from '@/components/common/session-link';
import { ThemeToggle } from '@/components/common/theme-toggle';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Chính sách bảo mật' },
  { href: '/terms', label: 'Điều khoản sử dụng' },
] as const;

/** Khung chung của các trang công khai: logo, đổi giao diện, đăng nhập và link pháp lý. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 w-full max-w-[1120px] items-center gap-2 px-4 md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <SessionLink
              variant="secondary"
              guest={{ href: '/login', label: 'Đăng nhập' }}
              member={{ href: '/dashboard', label: 'Trang của tôi' }}
            />
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-6 text-small text-text-muted sm:flex-row sm:items-center md:px-6 lg:px-8">
          <span>{BRAND_NAME}</span>
          <nav aria-label="Thông tin pháp lý" className="flex flex-wrap gap-x-4 sm:ml-auto">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:text-text hover:underline"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
