'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ERROR_CODES,
  STUDY_MODE_LABELS,
  type MyAssignmentDetail,
  type ProgressStatus,
  type StudyMode,
} from '@vocab/shared';
import { ArrowRight, CalendarClock, Check, RotateCcw, Send } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { BackLink } from '@/components/common/back-link';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import { classKeys, getMyAssignment, submitMyAssignment } from '../api';
import { formatDateTime } from '../format';
import { PROGRESS_STATUS } from './status-label';

const studyHref = (setId: string, mode: StudyMode, assignmentId: string) =>
  `/sets/${setId}/study/${mode.toLowerCase()}?assignment=${encodeURIComponent(assignmentId)}` as Route;

/** Trạng thái giống danh sách bài cần làm, tính từ chi tiết bài. */
export function progressStatusOf(
  { submission, dueAt, progress }: MyAssignmentDetail,
  now = Date.now(),
): ProgressStatus {
  if (submission) return submission.late ? 'late' : 'submitted';
  if (dueAt && Date.parse(dueAt) < now) return 'missed';
  return progress.some(({ done }) => done) ? 'in_progress' : 'todo';
}

function SubmitPanel({ assignment }: { assignment: MyAssignmentDetail }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const submit = useMutation({ mutationFn: () => submitMyAssignment(assignment.id) });
  const { progress, submission, setId, id } = assignment;
  const doneCount = progress.filter(({ done }) => done).length;
  const next = progress.find(({ done }) => !done);
  const status = progressStatusOf(assignment);
  const { label, icon: StatusIcon, className } = PROGRESS_STATUS[status];

  const confirm = () =>
    submit.mutate(undefined, {
      onSuccess: async (result) => {
        await queryClient.invalidateQueries({ queryKey: classKeys.all });
        setConfirming(false);
        toast.success(result.late ? 'Đã nộp bài, bài được ghi là nộp trễ' : 'Đã nộp bài');
      },
      onError: async (error) => {
        if (error instanceof HttpError && error.code === ERROR_CODES.ASSIGNMENT_ALREADY_SUBMITTED) {
          await queryClient.invalidateQueries({ queryKey: classKeys.myAssignment(id) });
          setConfirming(false);
        }
      },
    });

  let action;
  if (submission) {
    action = (
      <p className="flex flex-col gap-1">
        <span className="font-medium">
          {submission.late ? 'Nộp trễ' : 'Đã nộp'} lúc{' '}
          <span className="tabular-nums">{formatDateTime(submission.submittedAt)}</span>
          {submission.score !== null ? (
            <>
              {' · '}
              <span className="tabular-nums text-primary">{submission.score}%</span>
            </>
          ) : null}
        </span>
        <span className="text-small text-text-muted">
          Bạn vẫn học lại các chế độ để luyện thêm, điểm bài đã chốt.
        </span>
      </p>
    );
  } else if (next) {
    action = (
      <Button asChild className="self-start">
        <Link href={studyHref(setId, next.mode, id)}>
          {doneCount === 0 ? 'Bắt đầu' : 'Tiếp tục'}: {STUDY_MODE_LABELS[next.mode]}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    );
  } else {
    action = (
      <Button className="self-start" onClick={() => setConfirming(true)}>
        <Send aria-hidden className="size-4" />
        Nộp bài
      </Button>
    );
  }

  return (
    <section
      aria-label="Tiến độ bài tập"
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1.5 font-semibold', className)}>
          <StatusIcon aria-hidden className="size-5 shrink-0" />
          {label}
        </span>
        <span className="text-small text-text-muted tabular-nums">
          {doneCount}/{progress.length} chế độ đã xong
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Số chế độ đã xong"
        aria-valuemin={0}
        aria-valuemax={progress.length}
        aria-valuenow={doneCount}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full bg-primary transition-[width] duration-base ease-standard"
          style={{ width: `${progress.length ? (doneCount / progress.length) * 100 : 0}%` }}
        />
      </div>
      {action}
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) submit.reset();
        }}
        tone="primary"
        title="Nộp bài?"
        description={
          status === 'missed'
            ? 'Bài đã quá hạn nên sẽ được ghi là nộp trễ. Nộp xong không rút lại được, điểm được chốt theo lần làm tốt nhất của từng chế độ.'
            : 'Nộp xong không rút lại được, điểm được chốt theo lần làm tốt nhất của từng chế độ.'
        }
        confirmLabel="Nộp bài"
        cancelLabel="Để sau"
        pending={submit.isPending}
        error={submit.isError ? formErrorMessage(submit.error) : null}
        onConfirm={confirm}
      />
    </section>
  );
}

function ModeList({ assignment }: { assignment: MyAssignmentDetail }) {
  const { progress, setId, id } = assignment;
  return (
    <section aria-labelledby="assignment-modes" className="flex flex-col gap-2">
      <h2 id="assignment-modes" className="text-h3">
        Các chế độ cần làm
      </h2>
      <ol className="border-t border-border">
        {progress.map(({ mode, done, score }, index) => (
          <li key={mode} className="border-b border-border">
            <Link
              href={studyHref(setId, mode, id)}
              className="flex min-h-14 items-center gap-3 py-2 transition-colors duration-fast ease-standard hover:bg-primary-soft sm:px-2"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-small font-semibold tabular-nums',
                  done
                    ? 'bg-success-soft text-success'
                    : 'border border-border-strong text-text-muted',
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{STUDY_MODE_LABELS[mode]}</span>
                <span className="text-small text-text-muted">
                  {done
                    ? score !== null
                      ? `Đã xong · tốt nhất ${score}%`
                      : 'Đã xong'
                    : 'Chưa làm'}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-small font-medium text-primary">
                {done ? (
                  <>
                    <RotateCcw aria-hidden className="size-4" />
                    Làm lại
                  </>
                ) : (
                  <>
                    Làm
                    <ArrowRight aria-hidden className="size-4" />
                  </>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Trang học sinh làm bài giao: các chế độ theo thứ tự, nút tiếp tục và nộp bài. */
export function AssignmentWork({ assignmentId }: { assignmentId: string }) {
  const assignment = useQuery({
    queryKey: classKeys.myAssignment(assignmentId),
    queryFn: () => getMyAssignment(assignmentId),
  });

  const back = <BackLink href="/classes" label="Lớp học" />;

  if (assignment.isPending) {
    return (
      <>
        {back}
        <LoadingState label="Đang tải bài tập">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </LoadingState>
      </>
    );
  }
  if (assignment.isError) {
    const error = assignment.error;
    if (error instanceof HttpError && error.code === ERROR_CODES.ASSIGNMENT_NOT_FOUND) {
      return (
        <>
          {back}
          <EmptyState
            title="Không tìm thấy bài tập"
            description="Bài này đã bị xoá, hoặc bạn không còn trong lớp được giao bài."
            action={
              <Button asChild variant="secondary">
                <Link href="/classes">Về lớp học</Link>
              </Button>
            }
          />
        </>
      );
    }
    return (
      <>
        {back}
        <ErrorState
          title="Không tải được bài tập"
          description="Kiểm tra kết nối mạng rồi thử lại."
          onRetry={() => void assignment.refetch()}
        />
      </>
    );
  }

  const data = assignment.data;
  return (
    <>
      {back}
      <PageHeader title={data.setTitle} description={`Lớp ${data.className}`} />
      {data.dueAt ? (
        <p className="-mt-4 flex items-center gap-1.5 text-small text-text-muted">
          <CalendarClock aria-hidden className="size-4" />
          Hạn <span className="tabular-nums">{formatDateTime(data.dueAt)}</span>
        </p>
      ) : null}
      <SubmitPanel assignment={data} />
      <ModeList assignment={data} />
    </>
  );
}
