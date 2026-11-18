import type { Metadata } from 'next';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Tổng quan' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <EmptyState
        title="Chưa có tiến độ học"
        description="Tiến độ của bạn sẽ hiện ở đây sau phiên học đầu tiên."
      />
    </>
  );
}
