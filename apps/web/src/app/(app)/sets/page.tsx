import type { Metadata } from 'next';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Bộ từ' };

export default function SetsPage() {
  return (
    <>
      <PageHeader title="Bộ từ" />
      <EmptyState title="Chưa có bộ từ nào" description="Các bộ từ của bạn sẽ hiện ở đây." />
    </>
  );
}
