import type { Metadata } from 'next';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Ôn hôm nay' };

export default function ReviewPage() {
  return (
    <>
      <PageHeader title="Ôn hôm nay" />
      <EmptyState
        title="Hôm nay chưa có từ cần ôn"
        description="Các từ đến hạn ôn sẽ hiện ở đây."
      />
    </>
  );
}
