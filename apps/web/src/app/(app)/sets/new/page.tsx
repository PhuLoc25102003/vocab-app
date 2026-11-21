import type { Metadata } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { CreateSet } from '@/features/sets/components/create-set';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.newSet') };
}

export default async function NewSetPage() {
  const t = await getT('common');
  return (
    <PageContainer width="narrow">
      <BackLink href="/sets" label={t('pages.backToList')} />
      <PageHeader title={t('pages.newSet')} />
      <CreateSet />
    </PageContainer>
  );
}
