import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { CreateSet } from '@/features/sets/components/create-set';

export const metadata: Metadata = { title: 'Tạo bộ từ' };

export default function NewSetPage() {
  return (
    <>
      <PageHeader title="Tạo bộ từ" />
      <CreateSet />
    </>
  );
}
