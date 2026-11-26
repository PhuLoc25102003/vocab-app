import type { Metadata, Route } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { CreateSet } from '@/features/sets/components/create-set';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.newSet') };
}

export default async function NewSetPage({ searchParams }: PageProps<'/sets/new'>) {
  const t = await getT('common');
  const { folder } = (await searchParams) ?? {};
  const folderId = typeof folder === 'string' && folder && folder !== 'none' ? folder : undefined;
  const backHref = (folderId ? `/sets?folder=${folderId}` : '/sets') as Route;

  return (
    <PageContainer width="narrow">
      <BackLink href={backHref} label={t('pages.backToList')} />
      <PageHeader title={t('pages.newSet')} />
      <CreateSet folderId={folderId} />
    </PageContainer>
  );
}
