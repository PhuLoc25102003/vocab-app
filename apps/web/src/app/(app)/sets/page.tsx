import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { MySets } from '@/features/sets/components/my-sets';
import { SetRowsLoading } from '@/features/sets/components/set-rows';

export const metadata: Metadata = { title: 'Bộ từ' };

export default function SetsPage() {
  return (
    <>
      <PageHeader title="Bộ từ" />
      <Suspense fallback={<SetRowsLoading count={5} />}>
        <MySets />
      </Suspense>
    </>
  );
}
