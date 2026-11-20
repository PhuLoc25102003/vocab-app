'use client';

import { useQuery } from '@tanstack/react-query';
import {
  paginationSchema,
  STUDY_MODE_LABELS,
  type AssignmentResult,
  type AssignmentSummary,
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
import { percent, StatusLabel } from './status-label';
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
  const { memberCount, doneCount, overdueCount, averageScore, hardCards } = summary;
  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Đã làm"
          value={`${doneCount}/${memberCount}`}
          note={
            memberCount ? `${percent(doneCount, memberCount)}% học sinh` : 'Lớp chưa có học sinh'
          }
        />
        <Stat label="Quá hạn chưa làm" value={String(overdueCount)} />
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
  return (
    <li className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-2 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr]">
      <Link
        href={`/classes/${classId}/members/${row.userId}` as Route}
        className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 wrap-anywhere hover:underline"
      >
        {row.displayName}
      </Link>
      <StatusLabel status={row.status} />
      <span className="text-small text-text-muted">
        {row.completedAt ? `Xong ${formatDateTime(row.completedAt)}` : '—'}
      </span>
      <span className="text-right text-small tabular-nums sm:text-body">
        {row.correct !== null && row.total !== null
          ? `${row.correct}/${row.total} (${percent(row.correct, row.total)}%)`
          : 'Chưa có điểm'}
      </span>
    </li>
  );
}

function ResultsList({ classId, assignmentId }: { classId: string; assignmentId: string }) {
  const searchParams = useSearchParams();
  const page = paginationSchema.shape.page.catch(1).parse(searchParams.get('page') ?? undefined);
  const results = useQuery({
    queryKey: classKeys.results(classId, assignmentId, page),
    queryFn: () => listAssignmentResults(classId, assignmentId, page),
  });

  if (results.isPending) {
    return (
      <LoadingState label="Đang tải kết quả học sinh">
        <Skeleton className="h-40 w-full" />
      </LoadingState>
    );
  }
  if (results.isError) {
    return (
      <ErrorState
        title="Không tải được kết quả học sinh"
        description="Kiểm tra kết nối mạng rồi thử lại."
        onRetry={() => void results.refetch()}
      />
    );
  }
  const { data, meta } = results.data;
  if (data.length === 0) {
    return (
      <EmptyState title="Lớp chưa có học sinh" description="Gửi mã lớp để học sinh tham gia." />
    );
  }
  return (
    <>
      <ul aria-label="Kết quả từng học sinh" className="flex flex-col">
        {data.map((row) => (
          <ResultRow key={row.userId} classId={classId} row={row} />
        ))}
      </ul>
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / RESULTS_PAGE_SIZE)}
        hrefFor={(next) => `/classes/${classId}/assignments/${assignmentId}?page=${next}` as Route}
      />
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
        description={`${STUDY_MODE_LABELS[assignment.mode]}, ${due}`}
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
