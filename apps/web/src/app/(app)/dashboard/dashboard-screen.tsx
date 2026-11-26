'use client';

import { BookOpen, ChevronDown, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/page-header';
import { AdminOverview } from '@/features/admin/components/admin-overview';
import { useAuthStore } from '@/features/auth/store';
import { ClassWork } from '@/features/classes/components/class-work';
import { TeacherOverview } from '@/features/classes/components/teacher-overview';
import { RecentSets } from '@/features/sets/components/recent-sets';
import { StatsOverview } from '@/features/stats/components/stats-overview';

export function DashboardScreen() {
  const { t } = useTranslation('common');
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'ADMIN') {
    return (
      <div className="flex flex-col gap-8">
        {/* Dashboard quản trị ở trên cùng */}
        <AdminOverview />

        {/* Khối gập mở rõ ràng cho Giáo viên & Học sinh */}
        <details className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors duration-fast hover:border-primary/50 sm:p-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary border border-primary/20">
                <GraduationCap aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-body text-text group-hover:text-primary transition-colors">
                  {t('dashboard.teacherAndStudentView')}
                </span>
                <span className="text-small text-text-muted">
                  {t('dashboard.teacherAndStudentViewHint')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-small font-medium text-text-muted group-open:hidden">
                {t('dashboard.clickToExpand')}
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg text-text-muted group-hover:text-primary transition-colors">
                <ChevronDown
                  aria-hidden
                  className="size-4 transition-transform duration-fast ease-standard group-open:rotate-180"
                />
              </span>
            </div>
          </summary>
          <div className="mt-6 flex flex-col gap-8 border-t border-border pt-6">
            <TeacherOverview />
            <div className="flex flex-col gap-6">
              <h3 className="text-h3 font-semibold text-text">{t('pages.myLearning')}</h3>
              <ClassWork />
              <StatsOverview />
              <RecentSets />
            </div>
          </div>
        </details>
      </div>
    );
  }

  if (user?.role === 'TEACHER') {
    return (
      <div className="flex flex-col gap-8">
        <TeacherOverview />
        <details className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors duration-fast hover:border-primary/50 sm:p-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary border border-primary/20">
                <BookOpen aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-body text-text group-hover:text-primary transition-colors">
                  {t('pages.myLearning')}
                </span>
                <span className="text-small text-text-muted">{t('dashboard.myLearningHint')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-small font-medium text-text-muted group-open:hidden">
                {t('dashboard.clickToExpand')}
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg text-text-muted group-hover:text-primary transition-colors">
                <ChevronDown
                  aria-hidden
                  className="size-4 transition-transform duration-fast ease-standard group-open:rotate-180"
                />
              </span>
            </div>
          </summary>
          <div className="mt-6 flex flex-col gap-6 border-t border-border pt-6">
            <StatsOverview />
            <RecentSets />
          </div>
        </details>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('pages.dashboard')} />
      <ClassWork />
      <StatsOverview />
      <RecentSets />
    </>
  );
}
