'use client';

import { Library, School, Users, type LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type AdminTabKey = 'users' | 'hidden-sets' | 'classes';

interface AdminTabItem {
  key: AdminTabKey;
  href: Route;
  labelKey: 'tabs.users' | 'tabs.publicSets' | 'tabs.classes';
  mobileLabelKey: 'tabs.usersMobile' | 'tabs.publicSetsMobile' | 'tabs.classesMobile';
  icon: LucideIcon;
}

const ADMIN_TABS: AdminTabItem[] = [
  {
    key: 'users',
    href: '/admin/users' as Route,
    labelKey: 'tabs.users',
    mobileLabelKey: 'tabs.usersMobile',
    icon: Users,
  },
  {
    key: 'hidden-sets',
    href: '/admin/hidden-sets' as Route,
    labelKey: 'tabs.publicSets',
    mobileLabelKey: 'tabs.publicSetsMobile',
    icon: Library,
  },
  {
    key: 'classes',
    href: '/admin/classes' as Route,
    labelKey: 'tabs.classes',
    mobileLabelKey: 'tabs.classesMobile',
    icon: School,
  },
];

export function AdminNavTabs({ current }: { current: AdminTabKey }) {
  const { t } = useTranslation('admin');

  return (
    <nav aria-label={t('navLabel')}>
      <div className="w-full rounded-lg border border-border-strong/70 bg-surface/80 p-1 shadow-2xs backdrop-blur-sm">
        <ul className="grid grid-cols-3 gap-1">
          {ADMIN_TABS.map(({ key, href, labelKey, mobileLabelKey, icon: Icon }) => {
            const isActive = current === key;
            return (
              <li key={key} className="min-w-0">
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-md px-1.5 sm:px-3 py-1.5 sm:py-2 text-tiny sm:text-small font-medium transition-all duration-fast ease-standard text-center truncate',
                    isActive
                      ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                      : 'text-text-muted hover:bg-primary-soft hover:text-text',
                  )}
                >
                  <Icon aria-hidden className="size-3.5 sm:size-4 shrink-0" />
                  <span className="sm:hidden truncate">{t(mobileLabelKey)}</span>
                  <span className="hidden sm:inline truncate">{t(labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
