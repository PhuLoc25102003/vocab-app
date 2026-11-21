import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { AdminOverview } from '@/features/admin/components/admin-overview';
import { Can } from '@/features/auth/components/can';
import { ClassWork } from '@/features/classes/components/class-work';
import { RecentSets } from '@/features/sets/components/recent-sets';
import { StatsOverview } from '@/features/stats/components/stats-overview';

export const metadata: Metadata = { title: 'Tổng quan' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tổng quan" />
      {/* Bài tập lớp của học sinh; giáo viên có Tổng quan riêng ở việc 5.20. */}
      <Can action="manage-classes" fallback={<ClassWork />}>
        {null}
      </Can>
      <StatsOverview />
      <Can action="manage-users">
        <AdminOverview />
      </Can>
      <RecentSets />
    </>
  );
}
