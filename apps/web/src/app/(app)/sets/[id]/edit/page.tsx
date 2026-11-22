import type { Metadata, Route } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { EditSet } from '@/features/sets/components/edit-set';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.editSet') };
}

export default async function EditSetPage({ params }: PageProps<'/sets/[id]/edit'>) {
  const t = await getT('common');
  const { id } = await params;
  return (
    <PageContainer width="wide">
      <BackLink href={`/sets/${id}` as Route} label={t('pages.backToSet')} />
      <PageHeader title={t('pages.editSet')} />
      <EditSet id={id} />
    </PageContainer>
  );
}
