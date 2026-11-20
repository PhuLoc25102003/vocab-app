import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { MemberResults } from '@/features/classes/components/member-results';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Kết quả học sinh' };

export default async function MemberResultsPage({
  params,
}: PageProps<'/classes/[id]/members/[userId]'>) {
  const { id, userId } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState
          title="Trang dành cho giáo viên"
          description="Tài khoản giáo viên mới xem được kết quả học sinh."
        />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <MemberResults classId={id} userId={userId} />
      </Suspense>
    </Can>
  );
}
