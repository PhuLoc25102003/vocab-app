import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminClasses, AdminClassesLoading } from '@/features/admin/components/admin-classes';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminClasses') };
}

/** Nút quay lại, tiêu đề và thanh tab nằm ở `admin/layout.tsx`. */
export default function AdminClassesPage() {
  return (
    <Suspense fallback={<AdminClassesLoading />}>
      <AdminClasses />
    </Suspense>
  );
}
