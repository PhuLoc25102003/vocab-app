import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { SetCardsLoading } from '@/features/sets/components/set-cards';
import { MySetsScreen } from './my-sets-screen';

export const metadata: Metadata = { title: 'Bộ từ' };

export default function SetsPage() {
  return (
    <>
      <PageHeader
        title="Bộ từ"
        description="Thư viện của bạn: bộ từ bạn tạo, nhập và sao chép về. Bộ của người khác nằm ở Khám phá."
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
      <Suspense fallback={<SetCardsLoading count={6} />}>
        <MySetsScreen />
      </Suspense>
    </>
  );
}
