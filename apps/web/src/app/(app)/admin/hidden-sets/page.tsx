import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  AdminHiddenSets,
  AdminHiddenSetsLoading,
} from '@/features/admin/components/admin-hidden-sets';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.adminHiddenSets') };
}

/** Nút quay lại, tiêu đề và thanh tab nằm ở `admin/layout.tsx`. */
export default function AdminHiddenSetsPage() {
  return (
    <Suspense fallback={<AdminHiddenSetsLoading />}>
      <AdminHiddenSets />
    </Suspense>
  );
}
