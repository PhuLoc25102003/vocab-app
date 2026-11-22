import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { AdminClasses, AdminClassesLoading } from '@/features/admin/components/admin-classes';
import { AdminNavTabs } from '@/features/admin/components/admin-nav-tabs';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminClasses') };
}

export default async function AdminClassesPage() {
  const t = await getT('common');
  return (
    <>
      <BackLink href="/dashboard" label={t('pages.backToDashboard')} />
      <PageHeader title={t('pages.adminClasses')} />
      <div className="flex flex-col gap-2.5">
        <AdminNavTabs current="classes" />
        <Suspense fallback={<AdminClassesLoading />}>
          <AdminClasses />
        </Suspense>
      </div>
    </>
  );
}
