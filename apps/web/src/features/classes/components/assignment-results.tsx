'use client';

import { useQuery } from '@tanstack/react-query';
import {
  paginationSchema,
  PROGRESS_STATUSES,
  progressStatusSchema,
  type AssignmentResult,
  type AssignmentSummary,
  type ProgressStatus,
} from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
import {
  classKeys,
  getAssignmentSummary,
  listAssignmentResults,
  listAssignments,
  RESULTS_PAGE_SIZE,
} from '../api';
import { cn } from '@/lib/utils';
import { percent, PROGRESS_STATUS } from './status-label';
import { formatDateTime } from '../format';
import { useTranslation } from 'react-i18next';

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
      <dt className="text-small font-medium text-text-muted">{label}</dt>
      <dd className="text-h2 font-extrabold tabular-nums tracking-tight text-text">{value}</dd>
      {note ? <dd className="text-small text-text-muted">{note}</dd> : null}
    </div>
  );
}

function SummaryView({ summary }: { summary: AssignmentSummary }) {
  const { t } = useTranslation('classes');
  const { memberCount, submittedCount, lateCount, missedCount, averageScore, hardCards } = summary;
  const handedIn = submittedCount + lateCount;
  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t('results.handedIn')}
          value={`${handedIn}/${memberCount}`}
          note={
            memberCount
              ? t('results.percentStudents', { percent: percent(handedIn, memberCount) })
              : t('results.noStudents')
          }
        />
        <Stat label={t('results.late')} value={String(lateCount)} />
        <Stat label={t('results.missed')} value={String(missedCount)} />
        <Stat
          label={t('results.average')}
          value={averageScore === null ? t('results.none') : `${averageScore}%`}
          note={t('results.averageNote')}
        />
      </dl>
      <section
        aria-labelledby="hard-cards-title"
        className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs"
      >
        <h2 id="hard-cards-title" className="text-h3 font-bold text-text">
          {t('results.hardWords')}
        </h2>
        {hardCards.length === 0 ? (
          <p className="text-text-muted">{t('results.noWrong')}</p>
        ) : (
          <ol className="flex flex-col">
            {hardCards.map((card) => (
              <li
                key={card.cardId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/80 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 wrap-anywhere">
                  <span className="font-semibold text-text">{card.term}</span>
                  <span className="text-text-muted"> · {card.definition}</span>
                </span>
                <span className="text-small font-semibold text-danger tabular-nums">
                  {t('results.wrongRatio', { wrong: card.wrongCount, attempts: card.attemptCount })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

const RESULT_GRID = 'minmax(180px, 1.2fr) 140px minmax(300px, 2fr) 180px';

function ResultRow({ classId, row }: { classId: string; row: AssignmentResult }) {
  const { t } = useTranslation(['classes', 'common']);
  const { label, icon: Icon, className } = PROGRESS_STATUS[row.progressStatus];
  return (
    <DataTableRow
      as="li"
      gridTemplateColumns={RESULT_GRID}
      className="items-center gap-4 py-3 hover:bg-primary-soft sm:px-3"
    >
      <DataTableCell className="flex min-w-0 flex-col">
        <Link
          href={`/classes/${classId}/members/${row.userId}` as Route}
          className="truncate font-semibold text-primary hover:underline"
          title={row.displayName}
        >
          {row.displayName}
        </Link>
      </DataTableCell>

      <DataTableCell className="flex items-center">
        <span className={cn('flex items-center gap-1.5 text-small font-medium', className)}>
          <Icon aria-hidden className="size-4 shrink-0" />
          <span>{t(label)}</span>
        </span>
      </DataTableCell>

      <DataTableCell className="flex items-center min-w-0 overflow-hidden">
        <div className="overflow-x-auto max-w-full py-1 scrollbar-thin">
          <ul
            aria-label={t('results.modeScores')}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {row.modeScores.map(({ mode, done, score }) => (
              <li
                key={mode}
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-tiny font-medium transition-colors',
                  done
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'border border-border/70 bg-surface/50 text-text-muted',
                )}
              >
                {t(`common:modes.${mode}`)}
                {done ? (score === null ? ' ✓' : ` ${score}%`) : ' –'}
              </li>
            ))}
          </ul>
        </div>
      </DataTableCell>

      <DataTableCell align="right" className="text-small tabular-nums text-text-muted">
        {row.submission ? (
          <span className="font-medium text-text">
            {row.submission.score === null ? t('results.handedIn') : `${row.submission.score}%`} ·{' '}
            <span className="text-small font-normal text-text-muted">
              {formatDateTime(row.submission.submittedAt)}
            </span>
          </span>
        ) : (
          <span>{t('results.notSubmitted')}</span>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}

const STATUS_FILTERS: (ProgressStatus | undefined)[] = [undefined, ...PROGRESS_STATUSES];

function ResultsList({ classId, assignmentId }: { classId: string; assignmentId: string }) {
  const { t } = useTranslation(['classes', 'common']);
  const searchParams = useSearchParams();
  const [studentQuery, setStudentQuery] = useState('');
  const page = paginationSchema.shape.page.catch(1).parse(searchParams?.get('page') ?? undefined);
  const parsedStatus = progressStatusSchema.safeParse(searchParams?.get('status'));
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const base = `/classes/${classId}/assignments/${assignmentId}`;
  const href = (next: { page?: number; status?: ProgressStatus }) => {
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    if ((next.page ?? 1) > 1) params.set('page', String(next.page));
    const query = params.toString();
    return `${base}${query ? `?${query}` : ''}` as Route;
  };
  const results = useQuery({
    queryKey: classKeys.results(classId, assignmentId, page, status),
    queryFn: () => listAssignmentResults(classId, assignmentId, page, status),
  });

  if (results.isPending) {
    return (
      <LoadingState label={t('results.loadingStudents')}>
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (results.isError) {
    return (
      <ErrorState
        title={t('results.studentsFailed')}
        description={t('checkNetwork')}
        onRetry={() => void results.refetch()}
      />
    );
  }

  const { data, meta } = results.data;
  const filteredData = studentQuery
    ? data.filter((row) => row.displayName.toLowerCase().includes(studentQuery.toLowerCase()))
    : data;

  let body;
  if (data.length === 0) {
    body = status ? (
      <EmptyState
        title={t('results.noneInStatus')}
        description={t('results.noneInStatusHint', { status: t(PROGRESS_STATUS[status].label) })}
      />
    ) : (
      <EmptyState title={t('results.noStudents')} description={t('results.sendCode')} />
    );
  } else if (filteredData.length === 0) {
    body = (
      <ListNoMatch
        text={t('results.noMatch', { q: studentQuery })}
        clearHref={href({ status, page: 1 })}
      />
    );
  } else {
    body = (
      <DataTableContainer minWidth="min-w-[780px]">
        <DataTableHeader
          gridTemplateColumns={RESULT_GRID}
          columns={[
            { label: t('results.colStudent') },
            { label: t('results.colStatus') },
            { label: t('results.colModeScores') },
            { label: t('results.colSubmission'), align: 'right' },
          ]}
        />
        <ul aria-label={t('results.perStudentList')} className="flex flex-col">
          {filteredData.map((row) => (
            <ResultRow key={row.userId} classId={classId} row={row} />
          ))}
        </ul>
      </DataTableContainer>
    );
  }

  return (
    <ListPanel
      title={t('results.perStudent')}
      count={meta.total}
      toolbar={
        <ListToolbar
          tabs={STATUS_FILTERS.map((value) => ({
            label: value ? t(PROGRESS_STATUS[value].label) : t('results.all'),
            href: href({ status: value, page: 1 }),
            current: value === status,
          }))}
          search={{
            label: t('results.searchStudent'),
            value: studentQuery,
            onSearch: (q) => setStudentQuery(q),
          }}
        />
      }
      footer={
        meta.total > 0 ? (
          <ListPager
            page={meta.page}
            pageSize={RESULTS_PAGE_SIZE}
            total={meta.total}
            hrefFor={(next) => href({ page: next, status })}
          />
        ) : null
      }
    >
      {body}
    </ListPanel>
  );
}

export function AssignmentResults({
  classId,
  assignmentId,
}: {
  classId: string;
  assignmentId: string;
}) {
  const { t } = useTranslation(['classes', 'common']);
  const backHref = `/classes/${classId}` as Route;
  const assignments = useQuery({
    queryKey: classKeys.assignments(classId),
    queryFn: () => listAssignments(classId),
  });
  const summary = useQuery({
    queryKey: classKeys.summary(classId, assignmentId),
    queryFn: () => getAssignmentSummary(classId, assignmentId),
  });

  if (assignments.isPending || summary.isPending) {
    return (
      <LoadingState label={t('results.loading')}>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </LoadingState>
    );
  }
  const assignment = assignments.data?.data.find((item) => item.id === assignmentId);
  const missing =
    (assignments.isSuccess && !assignment) ||
    (summary.error instanceof HttpError && [403, 404].includes(summary.error.status));
  if (missing) {
    return (
      <>
        <BackLink href={backHref} label={t('backToClass')} />
        <EmptyState title={t('results.notFound')} description={t('results.notFoundHint')} />
      </>
    );
  }
  if (assignments.isError || summary.isError || !assignment) {
    return (
      <>
        <BackLink href={backHref} label={t('backToClass')} />
        <ErrorState
          title={t('results.failed')}
          description={t('checkNetwork')}
          onRetry={() => {
            void assignments.refetch();
            void summary.refetch();
          }}
        />
      </>
    );
  }

  const modes = assignment.modes?.length ? assignment.modes : [assignment.mode];
  const modesText = modes.map((mode) => t(`common:modes.${mode}`)).join(', ');
  const dueText = assignment.dueAt
    ? t('results.dueLower', { date: formatDateTime(assignment.dueAt) })
    : t('results.noDueLower');

  return (
    <>
      <BackLink href={backHref} label={t('backToClass')} />
      <PageHeader title={assignment.setTitle} description={`${modesText} · ${dueText}`} />
      <div className="flex flex-col gap-6">
        <SummaryView summary={summary.data} />
        <ResultsList classId={classId} assignmentId={assignmentId} />
      </div>
    </>
  );
}
