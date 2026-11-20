import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ExploreSets } from '@/features/sets/components/explore-sets';
import { SetCardsLoading } from '@/features/sets/components/set-cards';

export const metadata: Metadata = {
  title: 'Khám phá bộ từ',
  description: 'Tìm bộ từ công khai và học thử, không cần tài khoản.',
};

export default function PublicExplorePage() {
  return (
    <>
      <PageHeader
        title="Khám phá"
        description="Bộ từ công khai do cộng đồng tạo. Mở một bộ để học thử ngay."
      />
      <Suspense fallback={<SetCardsLoading count={6} />}>
        <ExploreSets audience="guest" />
      </Suspense>
    </>
  );
}
