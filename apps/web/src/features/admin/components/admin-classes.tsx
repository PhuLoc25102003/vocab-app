'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminClassItem } from '@vocab/shared';
import { ChevronDown, School, UserCheck, UserMinus } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListPanel } from '@/components/common/list-panel';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import { adminKeys, getAdminClassesOverview } from '../api';

function StatTile({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  icon: typeof School;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border-strong bg-surface p-4 shadow-sm">
      <span
        aria-hidden
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg',
          bgClass,
          colorClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col">
        <span className="text-small text-text-muted">{label}</span>
        <span className="text-h2 font-bold tabular-nums text-text">{value}</span>
      </div>
    </div>
  );
}

function ClassRow({ item }: { item: AdminClassItem }) {
  const { t, i18n } = useTranslation('admin');
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex flex-col border-b border-border py-3 last:border-b-0 sm:px-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text wrap-anywhere">{item.name}</span>
            <span className="rounded-sm bg-primary-soft px-2 py-0.5 text-tiny font-medium text-primary">
              {t('classes.code')}: {item.joinCode}
            </span>
            {item.archivedAt ? (
              <span className="rounded-sm bg-border px-2 py-0.5 text-tiny text-text-muted">
                {t('classes.archived')}
              </span>
            ) : null}
          </div>

          <p className="text-small text-text-muted">
            {t('classes.teacher')}:{' '}
            <span className="font-medium text-text">{item.teacher.displayName}</span> (
            {item.teacher.email})
          </p>

          <div className="flex flex-wrap items-center gap-x-3 text-tiny text-text-muted">
            <span>{t('classes.membersCount', { count: item.memberCount })}</span>
            <span>•</span>
            <span>{t('classes.assignmentsCount', { count: item.assignmentCount })}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="gap-1.5 text-small text-primary"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <span>{expanded ? t('classes.hideStudents') : t('classes.viewStudents')}</span>
          <ChevronDown
            aria-hidden
            className={cn('size-4 transition-transform duration-fast', expanded && 'rotate-180')}
          />
        </Button>
      </div>

      {expanded ? (
        <div className="mt-3 rounded-md border border-border bg-surface-elevated/40 p-3">
          <h4 className="mb-2 text-tiny font-semibold uppercase tracking-wider text-text-muted">
            {t('classes.studentList')} ({item.members.length})
          </h4>
          {item.members.length === 0 ? (
            <p className="text-small text-text-muted">{t('classes.noStudents')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {item.members.map((member) => {
                const joinedDate = new Intl.DateTimeFormat(
                  i18n.language === 'en' ? 'en-US' : 'vi-VN',
                  { dateStyle: 'short' },
                ).format(new Date(member.joinedAt));
                return (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-small"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-success shrink-0" />
                      <span className="font-medium">{member.displayName}</span>
                      <span className="text-text-muted">({member.email})</span>
                    </div>
                    <span className="text-tiny text-text-muted">
                      {t('classes.joinedAt', { date: joinedDate })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function AdminClassesLoading() {
  const { t } = useTranslation('admin');
  return (
    <LoadingState label={t('classes.loading')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="mt-4 h-64 w-full" />
    </LoadingState>
  );
}

export function AdminClasses() {
  const { t, i18n } = useTranslation('admin');
  const [classFilter, setClassFilter] = useState('');
  const [unassignedFilter, setUnassignedFilter] = useState('');
  const searchInputId = useId();

  const overview = useQuery({
    queryKey: adminKeys.classesOverview,
    queryFn: getAdminClassesOverview,
  });

  if (overview.isError && overview.error instanceof HttpError && overview.error.status === 403) {
    return <EmptyState title={t('users.forbidden')} description={t('users.forbiddenHint')} />;
  }

  if (overview.isPending) {
    return <AdminClassesLoading />;
  }

  if (overview.isError) {
    return (
      <ErrorState
        title={t('classes.failed')}
        description={t('checkNetwork')}
        onRetry={() => void overview.refetch()}
      />
    );
  }

  const data = overview.data;

  const filteredClasses = data.classes.filter(
    (c) =>
      c.name.toLowerCase().includes(classFilter.toLowerCase()) ||
      c.teacher.displayName.toLowerCase().includes(classFilter.toLowerCase()) ||
      c.teacher.email.toLowerCase().includes(classFilter.toLowerCase()) ||
      c.joinCode.toLowerCase().includes(classFilter.toLowerCase()),
  );

  const filteredUnassigned = data.unassignedStudents.filter(
    (s) =>
      s.displayName.toLowerCase().includes(unassignedFilter.toLowerCase()) ||
      s.email.toLowerCase().includes(unassignedFilter.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 3 Thẻ thống kê tổng quan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label={t('classes.totalClasses')}
          value={data.totalClasses}
          icon={School}
          colorClass="text-primary"
          bgClass="bg-primary-soft"
        />
        <StatTile
          label={t('classes.totalStudentsInClasses')}
          value={data.totalStudentsInClasses}
          icon={UserCheck}
          colorClass="text-success"
          bgClass="bg-success-soft"
        />
        <StatTile
          label={t('classes.totalUnassignedStudents')}
          value={data.totalUnassignedStudents}
          icon={UserMinus}
          colorClass="text-warning"
          bgClass="bg-warning-soft"
        />
      </div>

      {/* Bảng danh sách lớp học của từng giáo viên */}
      <ListPanel
        title={t('classes.byTeacherTitle')}
        count={data.totalClasses}
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              id={searchInputId}
              type="search"
              placeholder={t('classes.searchPlaceholder')}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
        }
      >
        {filteredClasses.length === 0 ? (
          <EmptyState
            title={t('classes.emptyClassesTitle')}
            description={t('classes.emptyClassesDesc')}
          />
        ) : (
          <ul aria-label={t('classes.byTeacherTitle')} className="flex flex-col">
            {filteredClasses.map((item) => (
              <ClassRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </ListPanel>

      {/* Bảng danh sách học sinh chưa có lớp học */}
      <ListPanel
        title={t('classes.unassignedTitle')}
        count={data.totalUnassignedStudents}
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              placeholder={t('classes.searchUnassignedPlaceholder')}
              value={unassignedFilter}
              onChange={(e) => setUnassignedFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
        }
      >
        {filteredUnassigned.length === 0 ? (
          <EmptyState
            title={t('classes.emptyUnassignedTitle')}
            description={t('classes.emptyUnassignedDesc')}
          />
        ) : (
          <ul
            aria-label={t('classes.unassignedTitle')}
            className="flex flex-col divide-y divide-border"
          >
            {filteredUnassigned.map((student) => {
              const initial = student.displayName.trim().charAt(0).toLocaleUpperCase('vi') || '?';
              const createdDate = new Intl.DateTimeFormat(
                i18n.language === 'en' ? 'en-US' : 'vi-VN',
                { dateStyle: 'medium' },
              ).format(new Date(student.createdAt));

              return (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 sm:px-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning font-semibold text-small"
                    >
                      {initial}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text">{student.displayName}</span>
                      <span className="text-small text-text-muted">{student.email}</span>
                    </div>
                  </div>

                  <span className="text-tiny text-text-muted">
                    {t('classes.registeredAt', { date: createdDate })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ListPanel>
    </div>
  );
}
