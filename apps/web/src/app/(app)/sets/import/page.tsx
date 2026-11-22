import type { Metadata, Route } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { ImportWizard } from '@/features/import/components/import-wizard';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.import') };
}

export default async function ImportPage({ searchParams }: PageProps<'/sets/import'>) {
  const t = await getT('common');
  const { setId } = await searchParams;
  const id = typeof setId === 'string' && setId ? setId : undefined;

  return (
    <PageContainer width="wide">
      {id ? (
        <BackLink href={`/sets/${id}` as Route} label={t('pages.backToSet')} />
      ) : (
        <BackLink href="/sets" label={t('pages.backToList')} />
      )}
      <PageHeader
        title={t(id ? 'pages.importMore' : 'pages.importList')}
        description={t('pages.importDescription')}
      />
      <ImportWizard key={id ?? 'new'} setId={id} />
    </PageContainer>
  );
}
