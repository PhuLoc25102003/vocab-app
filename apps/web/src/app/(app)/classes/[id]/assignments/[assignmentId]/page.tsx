import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { AssignmentResults } from '@/features/classes/components/assignment-results';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.assignmentResults') };
}

export default async function AssignmentResultsPage({
  params,
}: PageProps<'/classes/[id]/assignments/[assignmentId]'>) {
  const t = await getT('common');
  const { id, assignmentId } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState title={t('pages.teacherOnly')} description={t('pages.teacherOnlyResults')} />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <AssignmentResults classId={id} assignmentId={assignmentId} />
      </Suspense>
    </Can>
  );
}
