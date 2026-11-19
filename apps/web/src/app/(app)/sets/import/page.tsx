import type { Metadata, Route } from 'next';
import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { ImportWizard } from '@/features/import/components/import-wizard';

export const metadata: Metadata = { title: 'Nhập từ' };

export default async function ImportPage({ searchParams }: PageProps<'/sets/import'>) {
  const { setId } = await searchParams;
  const id = typeof setId === 'string' && setId ? setId : undefined;

  return (
    <>
      {id ? (
        <BackLink href={`/sets/${id}` as Route} label="Quay lại bộ từ" />
      ) : (
        <BackLink href="/sets" label="Quay lại danh sách" />
      )}
      <PageHeader
        title={id ? 'Nhập thêm thẻ' : 'Nhập danh sách từ'}
        description="Dán từ Quizlet, Excel, Google Sheets hoặc chọn file .txt, .csv. Mỗi dòng là một thẻ."
      />
      <ImportWizard key={id ?? 'new'} setId={id} />
    </>
  );
}
