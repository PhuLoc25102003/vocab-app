import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { AdminOverview } from '@/features/admin/components/admin-overview';
import { Can } from '@/features/auth/components/can';
import { ClassWork } from '@/features/classes/components/class-work';
import { TeacherOverview } from '@/features/classes/components/teacher-overview';
import { RecentSets } from '@/features/sets/components/recent-sets';
import { StatsOverview } from '@/features/stats/components/stats-overview';

export const metadata: Metadata = { title: 'Tổng quan' };

/** Mỗi vai trò một Tổng quan: học sinh thấy bài tập lớp và việc học, giáo viên thấy lớp. */
export default function DashboardPage() {
  return (
    <Can
      action="manage-classes"
      fallback={
        <>
          <PageHeader title="Tổng quan" />
          <ClassWork />
          <StatsOverview />
          <RecentSets />
        </>
      }
    >
      <TeacherOverview />
      <Can action="manage-users">
        <AdminOverview />
      </Can>
      <details className="group rounded-lg border border-border p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">
          Việc học của tôi
        </summary>
        <div className="mt-4 flex flex-col gap-6">
          <StatsOverview />
          <RecentSets />
        </div>
      </details>
    </Can>
  );
}
