import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import {
  AdminHiddenSets,
  AdminHiddenSetsLoading,
} from '@/features/admin/components/admin-hidden-sets';
import { AdminNavTabs } from '@/features/admin/components/admin-nav-tabs';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminHiddenSets') };
}

export default async function AdminHiddenSetsPage() {
  const t = await getT('common');
  return (
    <>
      <BackLink href="/dashboard" label={t('pages.backToDashboard')} />
      <PageHeader title={t('pages.adminHiddenSets')} />
      <div className="flex flex-col gap-2.5">
        <AdminNavTabs current="hidden-sets" />
        <Suspense fallback={<AdminHiddenSetsLoading />}>
          <AdminHiddenSets />
        </Suspense>
      </div>
    </>
  );
}
