import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ClassesLoading, TeacherClasses } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Lớp học' };

const NOT_TEACHER = (
  <EmptyState
    title="Trang dành cho giáo viên"
    description="Tài khoản giáo viên mới tạo và quản lý được lớp học."
  />
);

export default function ClassesPage() {
  return (
    <Can action="manage-classes" fallback={NOT_TEACHER}>
      <Suspense fallback={<ClassesLoading />}>
        <TeacherClasses />
      </Suspense>
    </Can>
  );
}
