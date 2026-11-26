'use client';

import { useQuery } from '@tanstack/react-query';
import type { OverviewAssignment, TeacherOverview as Overview } from '@vocab/shared';
import {
  CheckCircle2,
  CircleCheck,
  ClipboardList,
  GraduationCap,
  Plus,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { classKeys, getTeacherOverview, listClasses } from '../api';
import { dueText } from './class-work';
import { formatDateTime } from '../format';
import { AssignDialog } from './assign-dialog';
import { CreateClassDialog } from './teacher-classes';
import { useTranslation } from 'react-i18next';

function Tile({
  label,
  value,
  note,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="glass-surface grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-xl border border-border p-4 transition-all duration-fast hover:border-primary/50 hover:shadow-md sm:p-5">
      <dt className="col-span-2 row-start-2 font-medium text-text">{label}</dt>
      <dd className="col-start-1 row-start-1 text-h2 font-bold tabular-nums text-text">{value}</dd>
      {note ? <dd className="col-span-2 row-start-3 text-small text-text-muted">{note}</dd> : null}
      {Icon ? (
        <span
          aria-hidden
          className={cn(
            'col-start-2 row-start-1 flex size-8 items-center justify-center rounded-md',
            iconBg,
            iconColor,
          )}
        >
          <Icon className="size-4" />
        </span>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="glass-surface flex flex-col gap-3 rounded-xl border border-border p-4 sm:p-5"
    >
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}

const resultsHref = ({ classId, assignmentId }: OverviewAssignment) =>
  `/classes/${classId}/assignments/${assignmentId}` as Route;

function SubmitBar({ submitted, memberCount }: { submitted: number; memberCount: number }) {
  const { t } = useTranslation('classes');
  const value = memberCount ? Math.round((submitted * 100) / memberCount) : 0;
  return (
    <span className="flex items-center gap-2">
      <span
        role="meter"
        aria-label={t('overview.submitted')}
        aria-valuemin={0}
        aria-valuemax={memberCount}
        aria-valuenow={submitted}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-border"
      >
        <span className="block h-full bg-primary" style={{ width: `${value}%` }} />
      </span>
      <span className="text-small tabular-nums">
        {submitted}/{memberCount}
      </span>
    </span>
  );
}

function Attention({ attention }: { attention: Overview['attention'] }) {
  const { t } = useTranslation('classes');
  const { lowSubmissions, missedStreaks } = attention;
  if (lowSubmissions.length === 0 && missedStreaks.length === 0) {
    return (
      <p className="flex items-center gap-2 text-success">
        <CircleCheck aria-hidden className="size-5" />
        {t('overview.allGood')}
      </p>
    );
  }
  return (
    <ul className="flex flex-col">
      {lowSubmissions.map((item) => (
        <li key={item.assignmentId} className="border-b border-border py-2 last:border-b-0">
          <Link href={resultsHref(item)} className="flex min-h-11 flex-col justify-center">
            <span className="font-medium wrap-anywhere text-primary">
              {item.setTitle} · {item.className}
            </span>
            <span className="text-small text-text-muted">
              {t('overview.lowSubmissions', {
                due: dueText(item.dueAt, undefined, t),
                submitted: item.submitted,
                total: item.memberCount,
              })}
            </span>
          </Link>
        </li>
      ))}
      {missedStreaks.map((item) => (
        <li
          key={`${item.classId}:${item.userId}`}
          className="flex min-h-11 flex-col justify-center border-b border-border py-2 last:border-b-0"
        >
          <Link
            href={`/classes/${item.classId}/members/${item.userId}` as Route}
            className="inline-flex min-h-11 items-center font-medium wrap-anywhere text-primary"
          >
            {item.displayName}
          </Link>
          <span className="text-small text-danger">
            {t('overview.missedStreak', { count: item.missed, className: item.className })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyClasses({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation('classes');
  const steps = [t('overview.step1'), t('overview.step2'), t('overview.step3')];
  return (
    <section
      aria-label={t('overview.startLabel')}
      className="glass-surface flex flex-col gap-4 rounded-xl border border-border p-6"
    >
      <h2 className="text-h3 font-semibold text-text">{t('overview.startTitle')}</h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-1">{step}</span>
          </li>
        ))}
      </ol>
      <Button className="self-start" onClick={onCreate}>
        <Plus aria-hidden className="size-4" />
        {t('overview.createFirst')}
      </Button>
    </section>
  );
}

/** Tổng quan của giáo viên (việc 5.20): "Lớp nào, bài nào, em nào cần tôi nhắc?". */
export function TeacherOverview() {
  const { t } = useTranslation('classes');
  const [dialog, setDialog] = useState<'assign' | 'create' | null>(null);
  const overview = useQuery({ queryKey: classKeys.teacherOverview, queryFn: getTeacherOverview });
  const classes = useQuery({
    queryKey: classKeys.list(false, 1),
    queryFn: () => listClasses(false, 1),
    enabled: overview.isSuccess && overview.data.classCount > 0,
  });

  const noClasses = overview.isSuccess && overview.data.classCount === 0;
  const header = (
    <PageHeader
      title={t('overview.title')}
      actions={
        overview.isSuccess ? (
          noClasses ? (
            <Button onClick={() => setDialog('create')}>
              <Plus aria-hidden className="size-4" />
              {t('overview.createClass')}
            </Button>
          ) : (
            <Button onClick={() => setDialog('assign')}>
              <Send aria-hidden className="size-4" />
              {t('overview.assign')}
            </Button>
          )
        ) : null
      }
    />
  );
  const dialogs = (
    <>
      <CreateClassDialog
        open={dialog === 'create'}
        onOpenChange={(open) => setDialog(open ? 'create' : null)}
      />
      <AssignDialog
        classes={classes.data?.data ?? []}
        open={dialog === 'assign'}
        onOpenChange={(open) => setDialog(open ? 'assign' : null)}
      />
    </>
  );

  if (overview.isPending) {
    return (
      <>
        {header}
        <LoadingState label={t('overview.loading')}>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </LoadingState>
      </>
    );
  }
  if (overview.isError) {
    return (
      <>
        {header}
        <ErrorState
          title={t('overview.failed')}
          description={t('checkNetwork')}
          onRetry={() => void overview.refetch()}
        />
      </>
    );
  }
  const data = overview.data;
  if (noClasses) {
    return (
      <>
        {header}
        <EmptyClasses onCreate={() => setDialog('create')} />
        {dialogs}
      </>
    );
  }

  return (
    <>
      {header}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label={t('overview.classes')}
          value={String(data.classCount)}
          icon={GraduationCap}
          iconColor="text-primary"
          iconBg="bg-primary-soft"
        />
        <Tile
          label={t('overview.students')}
          value={String(data.studentCount)}
          note={
            data.newStudents ? t('overview.newStudents', { count: data.newStudents }) : undefined
          }
          icon={Users}
          iconColor="text-text-muted"
          iconBg="bg-bg"
        />
        <Tile
          label={t('overview.open')}
          value={String(data.openAssignmentCount)}
          note={data.dueSoonCount ? t('overview.dueSoon', { count: data.dueSoonCount }) : undefined}
          icon={ClipboardList}
          iconColor="text-highlight-fg"
          iconBg="bg-highlight"
        />
        <Tile
          label={t('overview.onTime')}
          value={data.onTimeRate === null ? t('overview.none') : `${data.onTimeRate}%`}
          note={t('overview.last30')}
          icon={CheckCircle2}
          iconColor="text-success"
          iconBg="bg-success-soft"
        />
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('overview.attention')}>
          <Attention attention={data.attention} />
        </Panel>
        <Panel title={t('overview.upcoming')}>
          {data.upcoming.length === 0 ? (
            <p className="text-text-muted">{t('overview.noUpcoming')}</p>
          ) : (
            <ul className="flex flex-col">
              {data.upcoming.map((item) => (
                <li key={item.assignmentId} className="border-b border-border last:border-b-0">
                  <Link
                    href={resultsHref(item)}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 hover:bg-primary-soft sm:px-2"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium wrap-anywhere">
                        {item.setTitle} · {item.className}
                      </span>
                      <span className="text-small text-text-muted">
                        {dueText(item.dueAt, undefined, t)}
                      </span>
                    </span>
                    <SubmitBar submitted={item.submitted} memberCount={item.memberCount} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title={t('overview.recent')}>
        {data.recentSubmissions.length === 0 ? (
          <p className="text-text-muted">{t('overview.noRecent')}</p>
        ) : (
          <ul className="flex flex-col">
            {data.recentSubmissions.map((item) => (
              <li
                key={`${item.assignmentId}:${item.userId}`}
                className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2 text-small last:border-b-0"
              >
                <Link
                  href={`/classes/${item.classId}/members/${item.userId}` as Route}
                  className="inline-flex min-h-11 items-center font-medium text-primary wrap-anywhere"
                >
                  {item.displayName}
                </Link>
                <span className="min-w-0 wrap-anywhere">
                  {item.setTitle} · {item.className}
                </span>
                <span className="tabular-nums">
                  {item.score === null ? t('overview.submitted') : `${item.score}%`}
                  {item.late ? t('overview.late') : ''}
                </span>
                <span className="ml-auto text-text-muted">{formatDateTime(item.submittedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {dialogs}
    </>
  );
}
