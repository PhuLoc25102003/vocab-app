'use client';

import { useQuery } from '@tanstack/react-query';
import type { MemberResult } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BackLink } from '@/components/common/back-link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ListNoMatch, ListPager, ListPanel, ListToolbar } from '@/components/common/list-panel';
import {
  DataTableContainer,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { classKeys, getMember, listMemberResults } from '../api';
import { formatDate, formatDateTime } from '../format';
import { percent, StatusLabel } from './status-label';
import { useTranslation } from 'react-i18next';

export const MEMBER_RESULTS_PAGE_SIZE = 10;

const MEMBER_RESULT_GRID = 'minmax(200px, 1.5fr) 130px 180px 140px';

function ResultRow({ classId, row }: { classId: string; row: MemberResult }) {
  const { t } = useTranslation(['classes', 'common']);
  return (
    <DataTableRow
      as="li"
      gridTemplateColumns={MEMBER_RESULT_GRID}
      className="items-center gap-4 py-3 hover:bg-primary-soft sm:px-3"
    >
      <DataTableCell className="flex min-w-0 flex-col">
        <Link
          href={`/classes/${classId}/assignments/${row.id}` as Route}
          className="truncate font-semibold text-primary hover:underline"
          title={row.setTitle}
        >
          {row.setTitle}
        </Link>
        <span className="text-small text-text-muted">
          {t(`common:modes.${row.mode}`)}
          {row.dueAt ? t('memberResults.dueSuffix', { date: formatDateTime(row.dueAt) }) : ''}
        </span>
      </DataTableCell>

      <DataTableCell className="flex items-center">
        <StatusLabel status={row.status} />
      </DataTableCell>

      <DataTableCell className="text-small text-text-muted">
        {row.completedAt
          ? t('memberResults.doneAt', { date: formatDateTime(row.completedAt) })
          : '—'}
      </DataTableCell>

      <DataTableCell align="right" className="text-small font-medium tabular-nums text-text-muted">
        {row.correct !== null && row.total !== null
          ? `${row.correct}/${row.total} (${percent(row.correct, row.total)}%)`
          : t('memberResults.noScore')}
      </DataTableCell>
    </DataTableRow>
  );
}

export function MemberResults({ classId, userId }: { classId: string; userId: string }) {
  const { t } = useTranslation(['classes', 'common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = `/classes/${classId}` as Route;

  const member = useQuery({
    queryKey: classKeys.member(classId, userId),
    queryFn: () => getMember(classId, userId),
  });
  const results = useQuery({
    queryKey: classKeys.memberResults(classId, userId),
    queryFn: () => listMemberResults(classId, userId),
  });

  const base = `/classes/${classId}/members/${userId}`;
  const pageParam = Number.parseInt(searchParams?.get('page') ?? '1', 10);
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const rawStatus = searchParams?.get('status');
  const status =
    rawStatus === 'pending' || rawStatus === 'done' || rawStatus === 'overdue'
      ? rawStatus
      : undefined;
  const q = searchParams?.get('q')?.trim() ?? '';

  const hrefFor = (next: {
    status?: 'pending' | 'done' | 'overdue';
    q?: string;
    page?: number;
  }): Route => {
    const params = new URLSearchParams();
    const nextStatus = 'status' in next ? next.status : status;
    const nextQ = 'q' in next ? next.q : q;
    const nextPage = next.page ?? 1;
    if (nextStatus) params.set('status', nextStatus);
    if (nextQ) params.set('q', nextQ);
    if (nextPage > 1) params.set('page', String(nextPage));
    const query = params.toString();
    return `${base}${query ? `?${query}` : ''}` as Route;
  };

  const go = (patch: { status?: 'pending' | 'done' | 'overdue'; q?: string; page?: number }) => {
    router.push(hrefFor({ page: 1, ...patch }));
  };

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
  const pending = rows.filter(({ status }) => status === 'pending').length;

  const filtered = rows.filter((item) => {
    if (status && item.status !== status) return false;
    if (q && !item.setTitle.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const total = filtered.length;
  const paged = filtered.slice(
    (page - 1) * MEMBER_RESULTS_PAGE_SIZE,
    page * MEMBER_RESULTS_PAGE_SIZE,
  );

  let listContent;
  if (filtered.length === 0) {
    listContent = (
      <ListNoMatch
        text={t('memberResults.noMatch', { q })}
        clearHref={hrefFor({ status: undefined, q: '', page: 1 })}
      />
    );
  } else {
    listContent = (
      <DataTableContainer minWidth="min-w-[650px]">
        <DataTableHeader
          gridTemplateColumns={MEMBER_RESULT_GRID}
          columns={[
            { label: t('memberResults.colAssignment') },
            { label: t('memberResults.colStatus') },
            { label: t('memberResults.colCompletedAt') },
            { label: t('memberResults.colScore'), align: 'right' },
          ]}
        />
        <ul aria-label={t('memberResults.list')} className="flex flex-col">
          {paged.map((row) => (
            <ResultRow key={row.id} classId={classId} row={row} />
          ))}
        </ul>
      </DataTableContainer>
    );
  }

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
        <div className="flex flex-col gap-4">
          <p className="text-body text-text-muted">
            {overdue
              ? t('memberResults.summaryOverdue', { done, total: rows.length, overdue })
              : t('memberResults.summary', { done, total: rows.length })}
          </p>
          <ListPanel
            title={t('memberResults.title')}
            count={rows.length}
            toolbar={
              <ListToolbar
                key={q}
                tabs={[
                  {
                    label: t('memberResults.all'),
                    href: hrefFor({ status: undefined, page: 1 }),
                    current: !status,
                    count: rows.length,
                  },
                  {
                    label: t('memberResults.pending'),
                    href: hrefFor({ status: 'pending', page: 1 }),
                    current: status === 'pending',
                    count: pending,
                  },
                  {
                    label: t('memberResults.done'),
                    href: hrefFor({ status: 'done', page: 1 }),
                    current: status === 'done',
                    count: done,
                  },
                  {
                    label: t('memberResults.overdue'),
                    href: hrefFor({ status: 'overdue', page: 1 }),
                    current: status === 'overdue',
                    count: overdue,
                  },
                ]}
                search={{
                  label: t('memberResults.searchPlaceholder'),
                  value: q,
                  onSearch: (newQ) => go({ q: newQ }),
                }}
              />
            }
            footer={
              total > 0 ? (
                <ListPager
                  page={page}
                  pageSize={MEMBER_RESULTS_PAGE_SIZE}
                  total={total}
                  hrefFor={(p) => hrefFor({ page: p })}
                />
              ) : null
            }
          >
            {listContent}
          </ListPanel>
        </div>
      )}
    </>
  );
}
