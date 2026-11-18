import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { RecentSets } from '@/features/sets/components/recent-sets';
import { StatsOverview } from '@/features/stats/components/stats-overview';

export const metadata: Metadata = { title: 'Tổng quan' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <StatsOverview />
      <RecentSets />
    </>
  );
}
