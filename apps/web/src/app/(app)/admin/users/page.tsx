import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { AdminNavTabs } from '@/features/admin/components/admin-nav-tabs';
import { AdminUsers, AdminUsersLoading } from '@/features/admin/components/admin-users';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminUsers') };
}

export default async function AdminUsersPage() {
  const t = await getT('common');
  return (
    <>
      <BackLink href="/dashboard" label={t('pages.backToDashboard')} />
      <PageHeader title={t('pages.adminUsers')} />
      <div className="flex flex-col gap-2.5">
        <AdminNavTabs current="users" />
        <Suspense fallback={<AdminUsersLoading />}>
          <AdminUsers />
        </Suspense>
      </div>
    </>
  );
}
