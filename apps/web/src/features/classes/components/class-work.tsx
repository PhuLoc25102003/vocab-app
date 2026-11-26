'use client';

import { useQuery } from '@tanstack/react-query';
import { getI18n, useTranslation } from 'react-i18next';
import type { MyAssignment } from '@vocab/shared';
import { ArrowRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { classKeys, listMyAssignments } from '../api';
import { formatDateTime } from '../format';
import { PROGRESS_STATUS } from './status-label';
import type { Locale } from '@/lib/i18n/config';

const MAX_ITEMS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** "Quá hạn 2 ngày", "Hạn hôm nay 23:59", "Hạn mai 23:59" hoặc ngày giờ đầy đủ. */
export function dueText(
  dueAt: string | null,
  now = new Date(),
  t = getI18n().getFixedT(null, 'classes'),
): string {
  if (!dueAt) return t('due.none');
  const due = new Date(dueAt);
  const locale = (getI18n().language ?? 'vi') as Locale;
  const timeFormat = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    hour: locale === 'en' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: locale === 'en',
  });
  if (due < now) {
    const days = Math.max(1, Math.floor((now.getTime() - due.getTime()) / DAY_MS));
    return t('due.overdue', { count: days });
  }
  const dayDiff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (dayDiff === 0) return t('due.today', { time: timeFormat.format(due) });
  if (dayDiff === 1) return t('due.tomorrow', { time: timeFormat.format(due) });
  return t('due.at', { date: formatDateTime(dueAt, locale) });
}

function WorkRow({ item }: { item: MyAssignment }) {
  const { t } = useTranslation('classes');
  const { label, icon: Icon, className } = PROGRESS_STATUS[item.progressStatus];
  const started = item.doneModes > 0;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2 last:border-b-0">
      <Icon aria-label={t(label)} className={cn('size-5 shrink-0', className)} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium wrap-anywhere">{item.setTitle}</span>
        <span className="flex flex-wrap gap-x-2 text-small text-text-muted">
          <span>{t('work.class', { name: item.className })}</span>
          <span
            className={item.progressStatus === 'missed' ? 'font-medium text-danger' : undefined}
          >
            {dueText(item.dueAt, undefined, t)}
          </span>
          {item.modes.length > 1 ? (
            <span className="tabular-nums">
              {t('work.modes', { done: item.doneModes, total: item.modes.length })}
            </span>
          ) : null}
        </span>
      </span>
      <Button asChild variant={item.progressStatus === 'missed' ? 'primary' : 'secondary'}>
        <Link href={`/classes/assignments/${item.id}` as Route}>
          {t(started ? 'work.continue' : 'work.start')}
          <span className="sr-only"> {item.setTitle}</span>
        </Link>
      </Button>
    </li>
  );
}

/**
 * Khối "Bài tập lớp" đầu Tổng quan của học sinh (việc 5.18): tối đa 3 bài chưa nộp, bỏ lỡ trước
 * rồi hạn gần nhất (máy chủ đã xếp). Chưa vào lớp hoặc không còn bài cần làm thì ẩn hẳn.
 */
export function ClassWork() {
  const { t } = useTranslation('classes');
  const assignments = useQuery({
    queryKey: classKeys.myAssignmentsPage(1),
    queryFn: () => listMyAssignments(1),
  });

  if (assignments.isPending) {
    return (
      <LoadingState label={t('work.loading')}>
        <Skeleton className="h-28 w-full" />
      </LoadingState>
    );
  }
  if (assignments.isError) {
    return (
      <ErrorState
        title={t('work.failed')}
        description={t('checkNetwork')}
        onRetry={() => void assignments.refetch()}
      />
    );
  }
  const todo = assignments.data.data
    .filter(({ progressStatus }) => progressStatus !== 'submitted' && progressStatus !== 'late')
    .slice(0, MAX_ITEMS);
  if (todo.length === 0) return null;

  return (
    <section
      aria-labelledby="class-work-title"
      className="glass-surface flex flex-col gap-2 rounded-xl border border-border p-4 sm:p-5"
    >
      <h2 id="class-work-title" className="text-h3">
        {t('work.title')}
      </h2>
      <ul className="flex flex-col">
        {todo.map((item) => (
          <WorkRow key={item.id} item={item} />
        ))}
      </ul>
      <Link
        href="/classes"
        className="inline-flex min-h-11 items-center gap-1 self-start text-small font-medium text-primary hover:underline"
      >
        {t('work.seeAll')}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </section>
  );
}
