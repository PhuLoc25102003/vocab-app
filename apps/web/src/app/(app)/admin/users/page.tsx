import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
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
      <PageHeader title={t('pages.adminUsers')} />
      <Suspense fallback={<AdminUsersLoading />}>
        <AdminUsers />
      </Suspense>
    </>
  );
}
