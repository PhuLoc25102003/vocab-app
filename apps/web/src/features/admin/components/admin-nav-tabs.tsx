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
  icon: LucideIcon;
}

const ADMIN_TABS: AdminTabItem[] = [
  { key: 'users', href: '/admin/users' as Route, labelKey: 'tabs.users', icon: Users },
  {
    key: 'hidden-sets',
    href: '/admin/hidden-sets' as Route,
    labelKey: 'tabs.publicSets',
    icon: Library,
  },
  { key: 'classes', href: '/admin/classes' as Route, labelKey: 'tabs.classes', icon: School },
];

export function AdminNavTabs({ current }: { current: AdminTabKey }) {
  const { t } = useTranslation('admin');

  return (
    <nav aria-label={t('navLabel')} className="mb-4">
      <ul className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {ADMIN_TABS.map(({ key, href, labelKey, icon: Icon }) => {
          const isActive = current === key;
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-md px-3.5 py-2 text-small font-medium transition-colors duration-fast ease-standard',
                  isActive
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-text-muted hover:bg-surface hover:text-text',
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
