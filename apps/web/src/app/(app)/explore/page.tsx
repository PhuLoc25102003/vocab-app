import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ExploreSets } from '@/features/sets/components/explore-sets';
import { SetRowsLoading } from '@/features/sets/components/set-rows';

export const metadata: Metadata = { title: 'Khám phá' };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Khám phá"
        description="Bộ từ công khai do cộng đồng tạo. Mở một bộ để học hoặc sao chép về thư viện của bạn."
      />
      <Suspense fallback={<SetRowsLoading count={5} />}>
        <ExploreSets />
      </Suspense>
    </>
  );
}
