import type { Metadata } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { CreateSet } from '@/features/sets/components/create-set';

export const metadata: Metadata = { title: 'Tạo bộ từ' };

export default function NewSetPage() {
  return (
    <>
      <BackLink href="/sets" label="Quay lại danh sách" />
      <PageHeader title="Tạo bộ từ" />
      <CreateSet />
    </>
  );
}
