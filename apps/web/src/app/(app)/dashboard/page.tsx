import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { AdminOverview } from '@/features/admin/components/admin-overview';
import { Can } from '@/features/auth/components/can';
import { RecentSets } from '@/features/sets/components/recent-sets';
import { StatsOverview } from '@/features/stats/components/stats-overview';

export const metadata: Metadata = { title: 'Tổng quan' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      <StatsOverview />
      <Can action="manage-users">
        <AdminOverview />
      </Can>
      <RecentSets />
    </>
  );
}
