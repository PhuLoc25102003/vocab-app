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

type NavItem = { href: Route; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/sets', label: 'Bộ từ', icon: BookOpen },
  { href: '/explore', label: 'Khám phá', icon: Compass },
  { href: '/review', label: 'Ôn hôm nay', icon: CalendarCheck },
];

/** Chỉ giáo viên và ADMIN thấy, học sinh có trang lớp ở việc 3.8. */
const CLASSES_ITEM: NavItem = { href: '/classes', label: 'Lớp học', icon: School };

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface AppNavProps {
  showClasses?: boolean;
}

export function AppNav({ showClasses = false }: AppNavProps) {
  return <NavLinks pathname={usePathname()} showClasses={showClasses} />;
}

/** Hiện trong lúc chờ đường dẫn ở các route có tham số, chưa đánh dấu mục nào. */
export function AppNavFallback({ showClasses = false }: AppNavProps) {
  return <NavLinks pathname="" showClasses={showClasses} />;
}

function NavLinks({ pathname, showClasses }: { pathname: string; showClasses: boolean }) {
  const items = showClasses ? [...NAV_ITEMS, CLASSES_ITEM] : NAV_ITEMS;
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:bg-transparent md:pb-0"
    >
      <ul className={cn('grid md:flex md:gap-2', showClasses ? 'grid-cols-5' : 'grid-cols-4')}>
        {items.map(({ href, label, icon: Icon }) => {
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
