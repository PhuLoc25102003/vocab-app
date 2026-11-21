import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { DueSets, DueSetsLoading } from '@/features/study/components/due-sets';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.review') };
}

export default async function ReviewPage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader title={t('pages.review')} />
      <Suspense fallback={<DueSetsLoading />}>
        <DueSets />
      </Suspense>
    </>
  );
}
