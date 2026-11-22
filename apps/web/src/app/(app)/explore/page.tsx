import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { SetCardsLoading } from '@/features/sets/components/set-cards';
import { getT } from '@/lib/i18n/server';
import { ExploreScreen } from './explore-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.explore') };
}

export default async function ExplorePage() {
  const t = await getT('common');
  return (
    <>
      <PageHeader title={t('pages.explore')} description={t('pages.exploreDescription')} />
      <Suspense fallback={<SetCardsLoading count={6} />}>
        <ExploreScreen />
      </Suspense>
    </>
  );
}
