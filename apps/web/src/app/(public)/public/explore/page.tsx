import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ExploreSets } from '@/features/sets/components/explore-sets';
import { SetRowsLoading } from '@/features/sets/components/set-rows';

export const metadata: Metadata = {
  title: 'Khám phá bộ từ',
  description: 'Tìm bộ từ công khai và học thử, không cần tài khoản.',
};

export default function PublicExplorePage() {
  return (
    <>
      <PageHeader title="Khám phá" description="Tìm bộ từ công khai và học thử ngay." />
      <Suspense fallback={<SetRowsLoading count={5} />}>
        <ExploreSets audience="guest" />
      </Suspense>
    </>
  );
}
