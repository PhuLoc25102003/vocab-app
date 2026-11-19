import type { Metadata, Route } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageContainer } from '@/components/common/page-container';
import { PageHeader } from '@/components/common/page-header';
import { EditSet } from '@/features/sets/components/edit-set';

export const metadata: Metadata = { title: 'Sửa bộ từ' };

export default async function EditSetPage({ params }: PageProps<'/sets/[id]/edit'>) {
  const { id } = await params;
  return (
    <PageContainer width="narrow">
      <BackLink href={`/sets/${id}` as Route} label="Quay lại bộ từ" />
      <PageHeader title="Sửa bộ từ" />
      <EditSet id={id} />
    </PageContainer>
  );
}
