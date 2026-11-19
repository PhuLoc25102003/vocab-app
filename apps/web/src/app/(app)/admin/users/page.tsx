import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { AdminUsers, AdminUsersLoading } from '@/features/admin/components/admin-users';

export const metadata: Metadata = { title: 'Quản lý người dùng' };

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader title="Quản lý người dùng" />
      <Suspense fallback={<AdminUsersLoading />}>
        <AdminUsers />
      </Suspense>
    </>
  );
}
