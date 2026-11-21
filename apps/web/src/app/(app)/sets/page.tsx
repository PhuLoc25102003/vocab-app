import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { SetCardsLoading } from '@/features/sets/components/set-cards';
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
        description={t('pages.setsDescription')}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/sets/import">{t('pages.importFromFile')}</Link>
            </Button>
            <Button asChild>
              <Link href="/sets/new">{t('pages.createSet')}</Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<SetCardsLoading count={6} />}>
        <MySetsScreen />
      </Suspense>
    </>
  );
}
