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
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { href: '/sets', label: 'sets', icon: BookOpen },
  { href: '/explore', label: 'explore', icon: Compass },
  { href: '/review', label: 'review', icon: CalendarCheck },
  { href: '/classes', label: 'classes', icon: School },
] as const satisfies readonly { href: Route; label: string; icon: LucideIcon }[];

function isCurrent(
  pathname: string,
  href: string,
  fromExplore?: boolean,
  fromReview?: boolean,
): boolean {
  if (fromReview && (pathname === '/sets' || pathname.startsWith('/sets/'))) {
    if (href === '/review') return true;
    if (href === '/sets') return false;
  }
  if (fromExplore && (pathname === '/sets' || pathname.startsWith('/sets/'))) {
    if (href === '/explore') return true;
    if (href === '/sets') return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');
  const fromExplore = from === 'explore';
  const fromReview = from === 'review' || searchParams?.has('due') || searchParams?.has('review');
  return <NavLinks pathname={pathname} fromExplore={fromExplore} fromReview={fromReview} />;
}

/** Hiện trong lúc chờ đường dẫn ở các route có tham số, chưa đánh dấu mục nào. */
export function AppNavFallback() {
  return <NavLinks pathname="" />;
}

function NavLinks({
  pathname,
  fromExplore,
  fromReview,
}: {
  pathname: string;
  fromExplore?: boolean;
  fromReview?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:bg-transparent md:pb-0"
    >
      <ul className="grid grid-cols-5 md:flex md:gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(pathname, href, fromExplore, fromReview);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-tiny transition-colors duration-fast ease-standard md:min-h-11 md:flex-row md:gap-2 md:rounded-md md:px-3 md:text-small',
                  current
                    ? 'bg-primary-soft/70 font-semibold text-primary md:bg-primary-soft md:text-primary md:shadow-2xs'
                    : 'text-text-muted hover:bg-primary-soft/50 hover:text-text font-medium',
                )}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className="max-w-full truncate px-0.5 text-center whitespace-nowrap">
                  {t(`nav.${label}`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
