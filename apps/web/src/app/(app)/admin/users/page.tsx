import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminUsers, AdminUsersLoading } from '@/features/admin/components/admin-users';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminUsers') };
}

/** Nút quay lại, tiêu đề và thanh tab nằm ở `admin/layout.tsx`. */
export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersLoading />}>
      <AdminUsers />
    </Suspense>
  );
}
