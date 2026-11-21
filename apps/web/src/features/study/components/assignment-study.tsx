'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignmentModeProgress, StudyMode } from '@vocab/shared';
import { ArrowRight, Send } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { accountStudyBackend, getAssignmentProgress } from '../api';
import { studyKeys } from '../query-keys';
import { StudyShell } from './study-shell';
import { Trans, useTranslation } from 'react-i18next';

/** Khoá gốc của dữ liệu lớp học, làm mới để danh sách và trang bài tập thấy chế độ vừa xong. */
const CLASSES_QUERY_ROOT = ['classes'] as const;

export const assignmentHref = (assignmentId: string) =>
  `/classes/assignments/${assignmentId}` as Route;

export const assignmentStudyHref = (setId: string, mode: StudyMode, assignmentId: string) =>
  `/sets/${setId}/study/${mode.toLowerCase()}?assignment=${encodeURIComponent(assignmentId)}` as Route;

/** Chế độ chưa xong kế tiếp theo thứ tự giáo viên đặt, quay vòng về đầu nếu cần. */
export function nextAssignmentMode(
  progress: AssignmentModeProgress[],
  current: StudyMode,
): StudyMode | null {
  const index = progress.findIndex(({ mode }) => mode === current);
  const ordered = [...progress.slice(index + 1), ...progress.slice(0, Math.max(index, 0))];
  return ordered.find(({ done, mode }) => !done && mode !== current)?.mode ?? null;
}

function AssignmentNext({
  setId,
  mode,
  assignmentId,
}: {
  setId: string;
  mode: StudyMode;
  assignmentId: string;
}) {
  const { t } = useTranslation(['study', 'common']);
  const progress = useQuery({
    queryKey: studyKeys.assignment(assignmentId),
    queryFn: () => getAssignmentProgress(assignmentId),
    staleTime: 0,
  });
  if (!progress.data) {
    return null;
  }
  const { progress: modes, submission } = progress.data;
  const doneCount = modes.filter(({ done }) => done).length;
  const next = submission ? null : nextAssignmentMode(modes, mode);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <p className="text-small text-text-muted">
        <Trans
          t={t}
          i18nKey="assignment.progress"
          values={{ className: progress.data.className, done: doneCount, total: modes.length }}
          components={[
            <span key="c" className="font-semibold text-text" />,
            <span key="n" className="tabular-nums" />,
          ]}
        />
      </p>
      {next ? (
        <Button asChild className="self-start">
          <Link href={assignmentStudyHref(setId, next, assignmentId)}>
            {t('chain.mode', { mode: t(`common:modes.${next}`) })}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button asChild className="self-start">
          <Link href={assignmentHref(assignmentId)}>
            {t(submission ? 'assignment.back' : 'assignment.backToSubmit')}
            {submission ? null : <Send aria-hidden className="size-4" />}
          </Link>
        </Button>
      )}
    </div>
  );
}

interface AssignmentStudyProps {
  setId: string;
  mode: StudyMode;
  assignmentId: string;
}

/** Phiên học làm cho một bài giao: thoát về trang bài tập, kết quả gợi ý chế độ tiếp theo. */
export function AssignmentStudy({ setId, mode, assignmentId }: AssignmentStudyProps) {
  const { t } = useTranslation(['study', 'common']);
  const queryClient = useQueryClient();
  const onFinished = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: studyKeys.assignment(assignmentId) });
    void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_ROOT });
  }, [assignmentId, queryClient]);

  return (
    <StudyShell
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      assignmentId={assignmentId}
      exitHref={assignmentHref(assignmentId)}
      exitLabel={t('assignment.back')}
      onFinished={onFinished}
      resultNote={<AssignmentNext setId={setId} mode={mode} assignmentId={assignmentId} />}
    />
  );
}
