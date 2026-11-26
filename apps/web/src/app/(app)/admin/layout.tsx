import type { ReactNode } from 'react';
import { BackLink } from '@/components/common/back-link';
import { AdminNavTabs, AdminPageTitle } from '@/features/admin/components/admin-nav-tabs';
import { getT } from '@/lib/i18n/server';

/**
 * Phần đầu chung của ba trang quản trị nằm ở layout nên giữ nguyên khi đổi tab: bong bóng kính
 * của tab trượt từ tab cũ sang tab mới, tiêu đề và thanh tab không chớp.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const t = await getT('common');
  return (
    <>
      <BackLink href="/dashboard" label={t('pages.backToDashboard')} />
      <AdminPageTitle />
      <div className="flex flex-col gap-2.5">
        <AdminNavTabs />
        {children}
      </div>
    </>
  );
}
