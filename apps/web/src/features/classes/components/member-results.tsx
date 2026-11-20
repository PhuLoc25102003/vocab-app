'use client';

import { useQuery } from '@tanstack/react-query';
import { STUDY_MODE_LABELS, type MemberResult } from '@vocab/shared';
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

function ResultRow({ classId, row }: { classId: string; row: MemberResult }) {
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
          {STUDY_MODE_LABELS[row.mode]}
          {row.dueAt ? `, hạn ${formatDateTime(row.dueAt)}` : ''}
        </span>
      </span>
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

export function MemberResults({ classId, userId }: { classId: string; userId: string }) {
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
      <LoadingState label="Đang tải kết quả học sinh">
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
        <BackLink href={backHref} label="Quay lại lớp" />
        <EmptyState
          title="Không tìm thấy học sinh"
          description="Học sinh đã rời lớp hoặc đây không phải lớp bạn dạy."
        />
      </>
    );
  }
  if (member.isError || results.isError) {
    return (
      <>
        <BackLink href={backHref} label="Quay lại lớp" />
        <ErrorState
          title="Không tải được kết quả học sinh"
          description="Kiểm tra kết nối mạng rồi thử lại."
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
      <BackLink href={backHref} label="Quay lại lớp" />
      <PageHeader
        title={member.data.displayName}
        description={`Vào lớp ${formatDate(member.data.joinedAt)}`}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Lớp chưa có bài giao"
          description="Giao bài ở trang lớp để xem kết quả."
        />
      ) : (
        <section aria-labelledby="member-results-title" className="flex flex-col gap-2">
          <h2 id="member-results-title" className="text-h2">
            Bài đã giao
          </h2>
          <p className="text-text-muted">
            Đã làm {done}/{rows.length} bài{overdue ? `, ${overdue} bài quá hạn chưa làm` : ''}.
          </p>
          <ul aria-label="Kết quả các bài" className="flex flex-col">
            {rows.map((row) => (
              <ResultRow key={row.id} classId={classId} row={row} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
