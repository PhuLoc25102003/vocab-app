import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { EditSet } from '@/features/sets/components/edit-set';

export const metadata: Metadata = { title: 'Sửa bộ từ' };

export default async function EditSetPage({ params }: PageProps<'/sets/[id]/edit'>) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Sửa bộ từ" />
      <EditSet id={id} />
    </>
  );
}
