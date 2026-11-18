import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicSet } from '@/features/sets/components/public-set';
import { SetDetailSkeleton } from '@/features/sets/components/set-detail-skeleton';
import { getPublicSet } from '@/features/sets/public-set';

type PublicSetPageProps = PageProps<'/public/sets/[id]'>;

export async function generateMetadata({ params }: PublicSetPageProps): Promise<Metadata> {
  const { id } = await params;
  const set = await getPublicSet(id);
  if (!set) {
    return { title: 'Không tìm thấy bộ từ', robots: { index: false } };
  }
  return { title: set.title, description: set.description ?? `Bộ từ gồm ${set.cardCount} thẻ` };
}

async function PublicSetContent({ params }: Pick<PublicSetPageProps, 'params'>) {
  const { id } = await params;
  return <PublicSet id={id} />;
}

export default function PublicSetPage({ params }: PublicSetPageProps) {
  return (
    <Suspense fallback={<SetDetailSkeleton />}>
      <PublicSetContent params={params} />
    </Suspense>
  );
}
