'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ERROR_CODES,
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation(['classes', 'common']);
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
        toast.success(t(result.late ? 'submit.lateDone' : 'submit.done'));
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
          {t(submission.late ? 'submit.lateAt' : 'submit.at')}{' '}
          <span className="tabular-nums">{formatDateTime(submission.submittedAt)}</span>
          {submission.score !== null ? (
            <>
              {' · '}
              <span className="tabular-nums text-primary">{submission.score}%</span>
            </>
          ) : null}
        </span>
        <span className="text-small text-text-muted">{t('submit.locked')}</span>
      </p>
    );
  } else if (next) {
    action = (
      <Button asChild className="self-start">
        <Link href={studyHref(setId, next.mode, id)}>
          {t(doneCount === 0 ? 'submit.start' : 'submit.continue', {
            mode: t(`common:modes.${next.mode}`),
          })}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    );
  } else {
    action = (
      <Button className="self-start" onClick={() => setConfirming(true)}>
        <Send aria-hidden className="size-4" />
        {t('submit.submit')}
      </Button>
    );
  }

  return (
    <section
      aria-label={t('submit.progress')}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1.5 font-semibold', className)}>
          <StatusIcon aria-hidden className="size-5 shrink-0" />
          {t(label)}
        </span>
        <span className="text-small text-text-muted tabular-nums">
          {t('submit.modesDone', { done: doneCount, total: progress.length })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('submit.modesDoneMeter')}
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
        title={t('submit.confirmTitle')}
        description={status === 'missed' ? t('submit.confirmLate') : t('submit.confirm')}
        confirmLabel={t('submit.submit')}
        cancelLabel={t('submit.later')}
        pending={submit.isPending}
        error={submit.isError ? formErrorMessage(submit.error) : null}
        onConfirm={confirm}
      />
    </section>
  );
}

function ModeList({ assignment }: { assignment: MyAssignmentDetail }) {
  const { t } = useTranslation(['classes', 'common']);
  const { progress, setId, id } = assignment;
  return (
    <section aria-labelledby="assignment-modes" className="flex flex-col gap-2">
      <h2 id="assignment-modes" className="text-h3">
        {t('modes.title')}
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
                <span className="font-medium">{t(`common:modes.${mode}`)}</span>
                <span className="text-small text-text-muted">
                  {done
                    ? score !== null
                      ? t('modes.doneBest', { score })
                      : t('modes.done')
                    : t('modes.todo')}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-small font-medium text-primary">
                {done ? (
                  <>
                    <RotateCcw aria-hidden className="size-4" />
                    {t('modes.redo')}
                  </>
                ) : (
                  <>
                    {t('modes.do')}
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
  const { t } = useTranslation('classes');
  const assignment = useQuery({
    queryKey: classKeys.myAssignment(assignmentId),
    queryFn: () => getMyAssignment(assignmentId),
  });

  const back = <BackLink href="/classes" label={t('work.backLabel')} />;

  if (assignment.isPending) {
    return (
      <>
        {back}
        <LoadingState label={t('work.loadingAssignment')}>
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
            title={t('work.notFound')}
            description={t('work.notFoundHint')}
            action={
              <Button asChild variant="secondary">
                <Link href="/classes">{t('work.backToClasses')}</Link>
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
          title={t('work.failedAssignment')}
          description={t('checkNetwork')}
          onRetry={() => void assignment.refetch()}
        />
      </>
    );
  }

  const data = assignment.data;
  return (
    <>
      {back}
      <PageHeader title={data.setTitle} description={t('work.class', { name: data.className })} />
      {data.dueAt ? (
        <p className="-mt-4 flex items-center gap-1.5 text-small text-text-muted">
          <CalendarClock aria-hidden className="size-4" />
          {t('dueLabel')} <span className="tabular-nums">{formatDateTime(data.dueAt)}</span>
        </p>
      ) : null}
      <SubmitPanel assignment={data} />
      <ModeList assignment={data} />
    </>
  );
}
