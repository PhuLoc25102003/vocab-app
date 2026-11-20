import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ClassDetail } from '@/features/classes/components/class-detail';
import { ClassesLoading } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Lớp học' };

export default async function ClassDetailPage({ params }: PageProps<'/classes/[id]'>) {
  const { id } = await params;
  return (
    <Can
      action="manage-classes"
      fallback={
        <EmptyState
          title="Trang dành cho giáo viên"
          description="Tài khoản giáo viên mới xem được trang quản lý lớp."
        />
      }
    >
      <Suspense fallback={<ClassesLoading />}>
        <ClassDetail id={id} />
      </Suspense>
    </Can>
  );
}
