import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { SetCardsLoading } from '@/features/sets/components/set-cards';
import { SetsHeaderActions } from '@/features/sets/components/sets-header-actions';
import { MySetsScreen } from './my-sets-screen';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.sets') };
}

export default async function SetsPage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader
        title={t('pages.sets')}
        actions={
          <Suspense>
            <SetsHeaderActions />
          </Suspense>
        }
      />
      <Suspense fallback={<SetCardsLoading count={6} />}>
        <MySetsScreen />
      </Suspense>
    </>
  );
}
