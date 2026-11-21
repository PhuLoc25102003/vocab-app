import type { Metadata } from 'next';
import { PageContainer } from '@/components/common/page-container';
import { AssignmentWork } from '@/features/classes/components/assignment-work';

export const metadata: Metadata = { title: 'Bài tập' };

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
