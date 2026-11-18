import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { DueSets, DueSetsLoading } from '@/features/study/components/due-sets';

export const metadata: Metadata = { title: 'Ôn hôm nay' };

export default function ReviewPage() {
  return (
    <>
      <PageHeader title="Ôn hôm nay" />
      <Suspense fallback={<DueSetsLoading />}>
        <DueSets />
      </Suspense>
    </>
  );
}
