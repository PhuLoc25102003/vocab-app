'use client';

import { Suspense } from 'react';
import { AppNav, AppNavFallback } from '@/components/common/app-nav';
import { can } from '../permissions';
import { useAuthStore } from '../store';

/** Thanh điều hướng chính, thêm mục Lớp học cho giáo viên và ADMIN. */
export function RoleNav() {
  const showClasses = useAuthStore((state) => can(state.user, 'manage-classes'));
  return (
    <Suspense fallback={<AppNavFallback showClasses={showClasses} />}>
      <AppNav showClasses={showClasses} />
    </Suspense>
  );
}
