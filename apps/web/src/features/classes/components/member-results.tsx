'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemberResult } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { BackLink } from '@/components/common/back-link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { classKeys, getMember, listMemberResults } from '../api';
import { formatDate, formatDateTime } from '../format';
import { percent, StatusLabel } from './status-label';
import { useTranslation } from 'react-i18next';

function ResultRow({ classId, row }: { classId: string; row: MemberResult }) {
  const { t } = useTranslation(['classes', 'common']);
  return (
    <li className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-2 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr]">
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/classes/${classId}/assignments/${row.id}` as Route}
          className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 wrap-anywhere hover:underline"
        >
          {row.setTitle}
        </Link>
        <span className="text-small text-text-muted">
          {t(`common:modes.${row.mode}`)}
          {row.dueAt ? t('memberResults.dueSuffix', { date: formatDateTime(row.dueAt) }) : ''}
        </span>
      </span>
      <StatusLabel status={row.status} />
      <span className="text-small text-text-muted">
        {row.completedAt
          ? t('memberResults.doneAt', { date: formatDateTime(row.completedAt) })
          : '—'}
      </span>
      <span className="text-right text-small tabular-nums sm:text-body">
        {row.correct !== null && row.total !== null
          ? `${row.correct}/${row.total} (${percent(row.correct, row.total)}%)`
          : t('memberResults.noScore')}
      </span>
    </li>
  );
}

export function MemberResults({ classId, userId }: { classId: string; userId: string }) {
  const { t } = useTranslation('classes');
  const backHref = `/classes/${classId}` as Route;
  const member = useQuery({
    queryKey: classKeys.member(classId, userId),
    queryFn: () => getMember(classId, userId),
  });
  const results = useQuery({
    queryKey: classKeys.memberResults(classId, userId),
    queryFn: () => listMemberResults(classId, userId),
  });

  if (member.isPending || results.isPending) {
    return (
      <LoadingState label={t('results.loadingStudents')}>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  const missing = [member.error, results.error].some(
    (error) => error instanceof HttpError && [403, 404].includes(error.status),
  );
  if (missing) {
    return (
      <>
        <BackLink href={backHref} label={t('backToClass')} />
        <EmptyState
          title={t('memberResults.notFound')}
          description={t('memberResults.notFoundHint')}
        />
      </>
    );
  }
  if (member.isError || results.isError) {
    return (
      <>
        <BackLink href={backHref} label={t('backToClass')} />
        <ErrorState
          title={t('results.studentsFailed')}
          description={t('checkNetwork')}
          onRetry={() => {
            void member.refetch();
            void results.refetch();
          }}
        />
      </>
    );
  }

  const rows = results.data.data;
  const done = rows.filter(({ status }) => status === 'done').length;
  const overdue = rows.filter(({ status }) => status === 'overdue').length;
  return (
    <>
      <BackLink href={backHref} label={t('backToClass')} />
      <PageHeader
        title={member.data.displayName}
        description={t('memberResults.joined', { date: formatDate(member.data.joinedAt) })}
      />
      {rows.length === 0 ? (
        <EmptyState title={t('memberResults.empty')} description={t('memberResults.emptyHint')} />
      ) : (
        <section aria-labelledby="member-results-title" className="flex flex-col gap-2">
          <h2 id="member-results-title" className="text-h2">
            {t('memberResults.title')}
          </h2>
          <p className="text-text-muted">
            {overdue
              ? t('memberResults.summaryOverdue', { done, total: rows.length, overdue })
              : t('memberResults.summary', { done, total: rows.length })}
          </p>
          <ul aria-label={t('memberResults.list')} className="flex flex-col">
            {rows.map((row) => (
              <ResultRow key={row.id} classId={classId} row={row} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
