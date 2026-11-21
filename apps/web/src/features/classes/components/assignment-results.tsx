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
import { BackLink } from '@/components/common/back-link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
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
    <div className="flex flex-col gap-1 rounded-md border border-border-strong bg-surface p-4">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="text-h2 tabular-nums">{value}</dd>
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
      <section aria-labelledby="hard-cards-title" className="flex flex-col gap-2">
        <h2 id="hard-cards-title" className="text-h3">
          {t('results.hardWords')}
        </h2>
        {hardCards.length === 0 ? (
          <p className="text-text-muted">{t('results.noWrong')}</p>
        ) : (
          <ol className="flex flex-col">
            {hardCards.map((card) => (
              <li
                key={card.cardId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-2 last:border-b-0"
              >
                <span className="min-w-0 wrap-anywhere">
                  <span className="font-medium">{card.term}</span>
                  <span className="text-text-muted"> · {card.definition}</span>
                </span>
                <span className="text-small text-danger tabular-nums">
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

function ResultRow({ classId, row }: { classId: string; row: AssignmentResult }) {
  const { t } = useTranslation(['classes', 'common']);
  const { label, icon: Icon, className } = PROGRESS_STATUS[row.progressStatus];
  return (
    <li className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-2 last:border-b-0 sm:grid-cols-[2fr_1fr_2fr_auto]">
      <Link
        href={`/classes/${classId}/members/${row.userId}` as Route}
        className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 wrap-anywhere hover:underline"
      >
        {row.displayName}
      </Link>
      <span className={cn('flex items-center gap-1 font-medium', className)}>
        <Icon aria-hidden className="size-4 shrink-0" />
        {t(label)}
      </span>
      <ul
        aria-label={t('results.modeScores')}
        className="col-span-2 flex flex-wrap gap-1 sm:col-span-1"
      >
        {row.modeScores.map(({ mode, done, score }) => (
          <li
            key={mode}
            className={cn(
              'rounded-sm px-2 text-tiny',
              done ? 'bg-primary-soft text-primary' : 'border border-border text-text-muted',
            )}
          >
            {t(`common:modes.${mode}`)}
            {done ? (score === null ? ' ✓' : ` ${score}%`) : ' –'}
          </li>
        ))}
      </ul>
      <span className="text-right text-small tabular-nums sm:text-body">
        {row.submission
          ? `${row.submission.score === null ? t('results.handedIn') : `${row.submission.score}%`} · ${formatDateTime(row.submission.submittedAt)}`
          : t('results.notSubmitted')}
      </span>
    </li>
  );
}

const STATUS_FILTERS: (ProgressStatus | undefined)[] = [undefined, ...PROGRESS_STATUSES];

function ResultsList({ classId, assignmentId }: { classId: string; assignmentId: string }) {
  const { t } = useTranslation(['classes', 'common']);
  const searchParams = useSearchParams();
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('page') ?? undefined);
  const parsedStatus = progressStatusSchema.safeParse(searchParams.get('status'));
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

  const filters = (
    <nav aria-label={t('common:list.statusFilter')} className="flex flex-wrap gap-1">
      {STATUS_FILTERS.map((value) => (
        <Link
          key={value ?? 'all'}
          href={href({ status: value })}
          aria-current={value === status ? 'page' : undefined}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-small font-medium text-text-muted transition-colors duration-fast ease-standard hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
        >
          {value ? t(PROGRESS_STATUS[value].label) : t('results.all')}
        </Link>
      ))}
    </nav>
  );

  let body;
  if (results.isPending) {
    body = (
      <LoadingState label={t('results.loadingStudents')}>
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  } else if (results.isError) {
    body = (
      <ErrorState
        title={t('results.studentsFailed')}
        description={t('checkNetwork')}
        onRetry={() => void results.refetch()}
      />
    );
  } else if (results.data.data.length === 0) {
    body = status ? (
      <EmptyState
        title={t('results.noneInStatus')}
        description={t('results.noneInStatusHint', { status: t(PROGRESS_STATUS[status].label) })}
      />
    ) : (
      <EmptyState title={t('results.noStudents')} description={t('results.sendCode')} />
    );
  } else {
    const { data, meta } = results.data;
    body = (
      <>
        <ul aria-label={t('results.perStudentList')} className="flex flex-col">
          {data.map((row) => (
            <ResultRow key={row.userId} classId={classId} row={row} />
          ))}
        </ul>
        <Pagination
          page={meta.page}
          pageCount={Math.ceil(meta.total / RESULTS_PAGE_SIZE)}
          hrefFor={(next) => href({ page: next, status })}
        />
      </>
    );
  }
  return (
    <>
      {filters}
      {body}
    </>
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

  const due = assignment.dueAt
    ? t('results.dueLower', { date: formatDateTime(assignment.dueAt) })
    : t('results.noDueLower');
  return (
    <>
      <BackLink href={backHref} label={t('backToClass')} />
      <PageHeader
        title={assignment.setTitle}
        description={`${(assignment.modes?.length ? assignment.modes : [assignment.mode]).map((mode) => t(`common:modes.${mode}`)).join(', ')} · ${due}`}
      />
      <SummaryView summary={summary.data} />
      <section aria-labelledby="results-title" className="flex flex-col gap-2">
        <h2 id="results-title" className="text-h2">
          {t('results.perStudent')}
        </h2>
        <ResultsList classId={classId} assignmentId={assignmentId} />
      </section>
    </>
  );
}
