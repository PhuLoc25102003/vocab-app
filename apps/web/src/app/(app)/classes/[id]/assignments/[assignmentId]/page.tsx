import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { AssignmentResults } from '@/features/classes/components/assignment-results';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Kết quả bài giao' };

export default async function AssignmentResultsPage({
  params,
}: PageProps<'/classes/[id]/assignments/[assignmentId]'>) {
  const { id, assignmentId } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState
          title="Trang dành cho giáo viên"
          description="Tài khoản giáo viên mới xem được kết quả của lớp."
        />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <AssignmentResults classId={id} assignmentId={assignmentId} />
      </Suspense>
    </Can>
  );
}
