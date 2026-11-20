import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudentClasses } from '@/features/classes/components/student-classes';
import { ClassesLoading, TeacherClasses } from '@/features/classes/components/teacher-classes';
import { Can } from '@/features/auth/components/can';

export const metadata: Metadata = { title: 'Lớp học' };

/** Giáo viên và ADMIN quản lý lớp, học sinh tham gia lớp và làm bài được giao. */
export default function ClassesPage() {
  return (
    <Can action="manage-classes" fallback={<StudentClasses />}>
      <Suspense fallback={<ClassesLoading />}>
        <TeacherClasses />
      </Suspense>
    </Can>
  );
}
