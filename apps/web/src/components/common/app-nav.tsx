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
import { GlassTabGroup, GlassTabIndicator } from '@/components/ui/glass-tabs';
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
      className="glass-overlay fixed inset-x-3 bottom-3 z-30 rounded-full border border-border px-1.5 md:static md:inset-auto md:border-0 md:bg-transparent md:bg-none md:px-0 md:shadow-none md:backdrop-blur-none"
    >
      <GlassTabGroup>
        <ul className="grid grid-cols-5 md:flex md:gap-0.5 lg:gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const current = isCurrent(pathname, href, fromExplore, fromReview);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'glass-button-ghost relative isolate flex min-h-16 flex-col items-center justify-center gap-1 rounded-full text-tiny md:min-h-11 md:flex-row md:gap-1.5 md:px-2.5 md:text-small xl:px-3',
                    current
                      ? 'font-semibold text-primary'
                      : 'font-medium text-text-muted hover:text-text',
                  )}
                >
                  {current ? <GlassTabIndicator /> : null}
                  <Icon aria-hidden className="size-5 shrink-0" />
                  <span className="max-w-full truncate px-0.5 text-center whitespace-nowrap md:sr-only lg:not-sr-only lg:whitespace-nowrap">
                    {t(`nav.${label}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </GlassTabGroup>
    </nav>
  );
}
