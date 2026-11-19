import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { MySets } from '@/features/sets/components/my-sets';
import { SetRowsLoading } from '@/features/sets/components/set-rows';

export const metadata: Metadata = { title: 'Bộ từ' };

export default function SetsPage() {
  return (
    <>
      <PageHeader
        title="Bộ từ"
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/sets/import">Nhập từ file</Link>
            </Button>
            <Button asChild>
              <Link href="/sets/new">Tạo bộ từ</Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<SetRowsLoading count={5} />}>
        <MySets />
      </Suspense>
    </>
  );
}
