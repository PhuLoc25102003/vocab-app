'use client';

import {
  BookOpen,
  CalendarCheck,
  Compass,
  LayoutDashboard,
  School,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { href: Route; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/sets', label: 'Bộ từ', icon: BookOpen },
  { href: '/explore', label: 'Khám phá', icon: Compass },
  { href: '/review', label: 'Ôn hôm nay', icon: CalendarCheck },
  { href: '/classes', label: 'Lớp học', icon: School },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  return <NavLinks pathname={usePathname()} />;
}

/** Hiện trong lúc chờ đường dẫn ở các route có tham số, chưa đánh dấu mục nào. */
export function AppNavFallback() {
  return <NavLinks pathname="" />;
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:bg-transparent md:pb-0"
    >
      <ul className="grid grid-cols-5 md:flex md:gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-tiny transition-colors duration-fast ease-standard hover:bg-primary-soft md:min-h-11 md:flex-row md:gap-2 md:rounded-md md:px-3 md:text-small',
                  current ? 'font-semibold text-primary' : 'text-text-muted',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
