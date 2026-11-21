import type { Metadata } from 'next';
import { PageContainer } from '@/components/common/page-container';
import { AssignmentWork } from '@/features/classes/components/assignment-work';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.assignment') };
}

export default async function AssignmentWorkPage({
  params,
}: PageProps<'/classes/assignments/[assignmentId]'>) {
  const { assignmentId } = await params;
  return (
    <PageContainer width="narrow">
      <AssignmentWork assignmentId={assignmentId} />
    </PageContainer>
  );
}
