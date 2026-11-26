'use client';

import { Library, School, Users, type LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/page-header';
import { GlassTabGroup, GlassTabIndicator } from '@/components/ui/glass-tabs';
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

const TITLE_KEYS = {
  users: 'pages.adminUsers',
  'hidden-sets': 'pages.adminHiddenSets',
  classes: 'pages.adminClasses',
} as const satisfies Record<AdminTabKey, string>;

/** Tab quản trị ứng với đường dẫn hiện tại, mặc định là Người dùng. */
function useAdminTab(): AdminTabKey {
  const pathname = usePathname() ?? '';
  return ADMIN_TABS.find(({ href }) => pathname.startsWith(href))?.key ?? 'users';
}

/** Tiêu đề trang quản trị theo tab hiện tại, đặt trong `admin/layout.tsx` cùng thanh tab. */
export function AdminPageTitle() {
  const { t } = useTranslation('common');
  return <PageHeader title={t(TITLE_KEYS[useAdminTab()])} />;
}

/**
 * Thanh tab quản trị. Đặt trong `admin/layout.tsx` nên không bị tạo lại khi đổi tab: bong bóng
 * kính trượt được từ tab cũ sang tab mới. Không truyền `current` thì lấy theo đường dẫn.
 */
export function AdminNavTabs({ current: currentProp }: { current?: AdminTabKey }) {
  const { t } = useTranslation('admin');
  const fromPath = useAdminTab();
  const current = currentProp ?? fromPath;

  return (
    <nav aria-label={t('navLabel')}>
      <div className="glass-surface w-full rounded-full border border-border p-1">
        <GlassTabGroup>
          <ul className="grid grid-cols-3 gap-1">
            {ADMIN_TABS.map(({ key, href, labelKey, mobileLabelKey, icon: Icon }) => {
              const isActive = current === key;
              return (
                <li key={key} className="min-w-0">
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'glass-button-ghost relative isolate flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-1.5 py-1.5 text-center text-tiny font-medium sm:gap-2 sm:px-3 sm:py-2 sm:text-small',
                      isActive
                        ? 'font-semibold text-primary-fg'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {isActive ? <GlassTabIndicator tone="tint" /> : null}
                    <Icon aria-hidden className="size-3.5 sm:size-4 shrink-0" />
                    <span className="sm:hidden truncate">{t(mobileLabelKey)}</span>
                    <span className="hidden sm:inline truncate">{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </GlassTabGroup>
      </div>
    </nav>
  );
}
