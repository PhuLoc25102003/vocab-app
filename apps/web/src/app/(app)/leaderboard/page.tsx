import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardScreen } from '@/features/leaderboard/components/leaderboard-screen';
import { getT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('common');
  return { title: t('pages.leaderboard') };
}

export default async function LeaderboardPage() {
  const t = await getT('common');
  return (
    <Suspense
      fallback={
        <LoadingState label={t('leaderboard.loading')}>
          <Skeleton className="h-64 w-full" />
        </LoadingState>
      }
    >
      <LeaderboardScreen />
    </Suspense>
  );
}
