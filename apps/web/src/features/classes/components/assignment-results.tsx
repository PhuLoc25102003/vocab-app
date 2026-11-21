'use client';

import { useQuery } from '@tanstack/react-query';
import {
  paginationSchema,
  PROGRESS_STATUSES,
  progressStatusSchema,
  STUDY_MODE_LABELS,
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
  const { memberCount, submittedCount, lateCount, missedCount, averageScore, hardCards } = summary;
  const handedIn = submittedCount + lateCount;
  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Đã nộp"
          value={`${handedIn}/${memberCount}`}
          note={
            memberCount ? `${percent(handedIn, memberCount)}% học sinh` : 'Lớp chưa có học sinh'
          }
        />
        <Stat label="Nộp trễ" value={String(lateCount)} />
        <Stat label="Bỏ lỡ" value={String(missedCount)} />
        <Stat
          label="Điểm trung bình"
          value={averageScore === null ? 'Chưa có' : `${averageScore}%`}
          note="Tính lần làm tốt nhất của học sinh đã làm"
        />
      </dl>
      <section aria-labelledby="hard-cards-title" className="flex flex-col gap-2">
        <h2 id="hard-cards-title" className="text-h3">
          Từ cả lớp hay sai
        </h2>
        {hardCards.length === 0 ? (
          <p className="text-text-muted">Chưa có từ nào bị trả lời sai.</p>
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
                  Sai {card.wrongCount}/{card.attemptCount} lần
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
        {label}
      </span>
      <ul aria-label="Điểm từng chế độ" className="col-span-2 flex flex-wrap gap-1 sm:col-span-1">
        {row.modeScores.map(({ mode, done, score }) => (
          <li
            key={mode}
            className={cn(
              'rounded-sm px-2 text-tiny',
              done ? 'bg-primary-soft text-primary' : 'border border-border text-text-muted',
            )}
          >
            {STUDY_MODE_LABELS[mode]}
            {done ? (score === null ? ' ✓' : ` ${score}%`) : ' –'}
          </li>
        ))}
      </ul>
      <span className="text-right text-small tabular-nums sm:text-body">
        {row.submission
          ? `${row.submission.score === null ? 'Đã nộp' : `${row.submission.score}%`} · ${formatDateTime(row.submission.submittedAt)}`
          : 'Chưa nộp'}
      </span>
    </li>
  );
}

const STATUS_FILTERS: (ProgressStatus | undefined)[] = [undefined, ...PROGRESS_STATUSES];

function ResultsList({ classId, assignmentId }: { classId: string; assignmentId: string }) {
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
    <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1">
      {STATUS_FILTERS.map((value) => (
        <Link
          key={value ?? 'all'}
          href={href({ status: value })}
          aria-current={value === status ? 'page' : undefined}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-small font-medium text-text-muted transition-colors duration-fast ease-standard hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
        >
          {value ? PROGRESS_STATUS[value].label : 'Tất cả'}
        </Link>
      ))}
    </nav>
  );

  let body;
  if (results.isPending) {
    body = (
      <LoadingState label="Đang tải kết quả học sinh">
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  } else if (results.isError) {
    body = (
      <ErrorState
        title="Không tải được kết quả học sinh"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void results.refetch()}
      />
    );
  } else if (results.data.data.length === 0) {
    body = status ? (
      <EmptyState
        title="Không có học sinh nào"
        description={`Chưa có học sinh ở trạng thái "${PROGRESS_STATUS[status].label}".`}
      />
    ) : (
      <EmptyState title="Lớp chưa có học sinh" description="Gửi mã lớp để học sinh tham gia." />
    );
  } else {
    const { data, meta } = results.data;
    body = (
      <>
        <ul aria-label="Kết quả từng học sinh" className="flex flex-col">
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
      <LoadingState label="Đang tải kết quả">
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
        <BackLink href={backHref} label="Quay lại lớp" />
        <EmptyState
          title="Không tìm thấy bài giao"
          description="Bài đã bị huỷ, bộ từ đã bị xoá hoặc đây không phải lớp bạn dạy."
        />
      </>
    );
  }
  if (assignments.isError || summary.isError || !assignment) {
    return (
      <>
        <BackLink href={backHref} label="Quay lại lớp" />
        <ErrorState
          title="Không tải được kết quả"
          description="Kiểm tra kết nối mạng rồi thử lại."
          onRetry={() => {
            void assignments.refetch();
            void summary.refetch();
          }}
        />
      </>
    );
  }

  const due = assignment.dueAt ? `hạn ${formatDateTime(assignment.dueAt)}` : 'không có hạn';
  return (
    <>
      <BackLink href={backHref} label="Quay lại lớp" />
      <PageHeader
        title={assignment.setTitle}
        description={`${(assignment.modes?.length ? assignment.modes : [assignment.mode]).map((mode) => STUDY_MODE_LABELS[mode]).join(', ')} · ${due}`}
      />
      <SummaryView summary={summary.data} />
      <section aria-labelledby="results-title" className="flex flex-col gap-2">
        <h2 id="results-title" className="text-h2">
          Từng học sinh
        </h2>
        <ResultsList classId={classId} assignmentId={assignmentId} />
      </section>
    </>
  );
}
