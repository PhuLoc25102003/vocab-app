'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ERROR_CODES, type StudyMode } from '@vocab/shared';
import { ListOrdered, Shuffle, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import { cn } from '@/lib/utils';
import type { StudyBackend } from '../api';
import { useAnswerSync } from '../hooks/use-answer-sync';
import { STUDY_ROUND_SIZE, STUDY_VIEWS } from '../modes/views';
import { studyKeys } from '../query-keys';
import {
  clearSnapshot,
  loadSnapshot,
  studySnapshotKey,
  type ResumableSession,
} from '../session-snapshot';
import { useStudyStore } from '../session.store';
import { StudyResult } from './study-result';
import { useTranslation } from 'react-i18next';

const BACKGROUND_SYNC_SIZE = 10;
/** Phiên đã hết hiệu lực trên server, ví dụ đã kết thúc ở lần trước. */
const STALE_SESSION_STATUSES = new Set([403, 404, 409]);

interface StudyShellProps {
  backend: StudyBackend;
  setId: string;
  mode: StudyMode;
  exitHref: Route;
  resultNote?: ReactNode;
  /** Chỉ học các thẻ đã đến hạn ôn. */
  dueOnly?: boolean;
  /** Nội dung thêm dưới thanh tiến độ, ví dụ các bước của lộ trình. */
  header?: ReactNode;
  /** Chế độ không dùng được với bộ này (quá ít thẻ, thiếu ví dụ). Có hàm này thì gọi thay vì báo lỗi. */
  onUnavailable?: () => void;
  /** Phiên làm cho bài giao này; học lại thẻ sai không gắn bài để điểm bài không bị thổi phồng. */
  assignmentId?: string;
  /** Nhãn nút thoát ở màn kết quả, mặc định "Về bộ từ". */
  exitLabel?: string;
  /** Thoát phiên học (ví dụ học offline đóng modal quay lại danh sách). */
  onExit?: () => void;
  /** Gọi khi máy chủ đã lưu kết quả phiên. */
  onFinished?: () => void;
  /** Chỉ học các thẻ này ngay từ đầu, ví dụ chế độ thứ hai khi ôn nhiều chế độ. Không khôi phục phiên dở. */
  cardIds?: string[];
}

const UNAVAILABLE_CODES = new Set<string>([
  ERROR_CODES.STUDY_MODE_UNAVAILABLE,
  ERROR_CODES.NO_QUESTIONS_FOR_MODE,
]);

function ShuffleToggle() {
  const { t } = useTranslation('study');
  const shuffle = useStudyStore((state) => state.shuffle);
  const toggleShuffle = useStudyStore((state) => state.toggleShuffle);

  const handleToggle = () => {
    toggleShuffle();
    const nextState = useStudyStore.getState().shuffle;
    if (nextState) {
      toast.info(t('shell.shuffleOnToast'));
    } else {
      toast.info(t('shell.shuffleOffToast'));
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleToggle}
      className={cn(
        'min-h-11 min-w-11 px-2.5 gap-1.5 text-tiny font-medium rounded-md transition-all shrink-0 select-none',
        shuffle
          ? 'bg-primary-soft text-primary border border-primary/25 hover:bg-primary-soft/80'
          : 'text-text-muted hover:text-text hover:bg-surface-elevated/60',
      )}
      title={t(shuffle ? 'shell.shuffleOnTooltip' : 'shell.shuffleOffTooltip')}
      aria-label={t(shuffle ? 'shell.shuffleOn' : 'shell.shuffleOff')}
    >
      {shuffle ? (
        <Shuffle aria-hidden className="size-3.5 text-primary" />
      ) : (
        <ListOrdered aria-hidden className="size-3.5 text-text-muted" />
      )}
      <span className="sr-only sm:not-sr-only">
        {t(shuffle ? 'shell.shuffleOn' : 'shell.shuffleOff')}
      </span>
    </Button>
  );
}

function StudyFrame({
  exitHref,
  onExit,
  position,
  total,
  header,
  children,
}: {
  exitHref: Route;
  onExit?: () => void;
  position: number;
  total: number;
  header?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation('study');
  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-bg">
      <header className="mx-auto flex w-full max-w-[720px] items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2">
        {onExit ? (
          <Button variant="ghost" size="icon" onClick={onExit} aria-label={t('shell.exit')}>
            <X aria-hidden className="size-5" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon">
            <Link href={exitHref} aria-label={t('shell.exit')}>
              <X aria-hidden className="size-5" />
            </Link>
          </Button>
        )}
        <div
          role="progressbar"
          aria-label={t('shell.progress')}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full bg-primary transition-[width] duration-base ease-standard"
            style={{ width: `${total > 0 ? (position / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-small tabular-nums whitespace-nowrap">
          {position}/{total}
        </span>
        <ShuffleToggle />
      </header>
      {header ? <div className="mx-auto w-full max-w-[720px] px-4">{header}</div> : null}
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </div>
    </div>
  );
}

function StartFailure({
  error,
  exitHref,
  onExit,
  onRetry,
}: {
  error: unknown;
  exitHref: Route;
  onExit?: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation('study');
  const code = error instanceof HttpError ? error.code : null;
  const exitAction = onExit ? (
    <Button variant="secondary" onClick={onExit}>
      {t('shell.back')}
    </Button>
  ) : (
    <Button asChild variant="secondary">
      <Link href={exitHref}>{t('shell.back')}</Link>
    </Button>
  );

  if (code === ERROR_CODES.NO_CARDS_DUE) {
    return (
      <EmptyState
        title={t('shell.allReviewed')}
        description={t('shell.allReviewedHint')}
        action={exitAction}
      />
    );
  }
  if (code === ERROR_CODES.NO_QUESTIONS_FOR_MODE) {
    return (
      <EmptyState
        title={t('shell.noCloze')}
        description={t('shell.noClozeHint')}
        action={exitAction}
      />
    );
  }
  if (code === ERROR_CODES.SET_HAS_NO_CARDS || code === ERROR_CODES.SET_NOT_FOUND) {
    return (
      <EmptyState
        title={t(code === ERROR_CODES.SET_HAS_NO_CARDS ? 'shell.noCards' : 'shell.notFound')}
        description={
          code === ERROR_CODES.SET_HAS_NO_CARDS ? t('shell.noCardsHint') : t('shell.notFoundHint')
        }
        action={exitAction}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ErrorState
        title={t('shell.startFailed')}
        description={t('shell.checkNetwork')}
        onRetry={onRetry}
      />
      <div>{exitAction}</div>
    </div>
  );
}

export function StudyShell({
  backend,
  setId,
  mode,
  exitHref,
  resultNote,
  dueOnly = false,
  header,
  onUnavailable,
  assignmentId,
  exitLabel,
  onExit,
  onFinished,
  cardIds: initialCardIds,
}: StudyShellProps) {
  const { t } = useTranslation('study');
  const queryClient = useQueryClient();
  const snapshotKey =
    backend.resumable && !initialCardIds
      ? studySnapshotKey(setId, mode, dueOnly, assignmentId)
      : undefined;
  const retryCardIds = useRef<string[] | null>(null);
  const started = useQuery({
    queryKey: studyKeys.session(setId, mode, dueOnly, assignmentId),
    queryFn: async (): Promise<ResumableSession> => {
      const cardIds = retryCardIds.current ?? initialCardIds;
      retryCardIds.current = null;
      if (cardIds) {
        return backend.start(setId, mode, { cardIds });
      }
      return (
        (snapshotKey ? loadSnapshot(snapshotKey) : null) ??
        backend.start(setId, mode, assignmentId ? { dueOnly, assignmentId } : { dueOnly })
      );
    },
    // Mỗi lần tải là một phiên mới, nên chỉ tạo khi người học yêu cầu.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const session = useStudyStore((state) => state.session);
  const questions = useStudyStore((state) => state.questions);
  const languages = useStudyStore((state) => state.languages);
  const position = useStudyStore((state) => state.position);
  const pendingCount = useStudyStore((state) => state.pending.length);
  const result = useStudyStore((state) => state.result);
  const begin = useStudyStore((state) => state.begin);
  const answer = useStudyStore((state) => state.answer);
  const skip = useStudyStore((state) => state.skip);
  const record = useStudyStore((state) => state.record);
  const finish = useStudyStore((state) => state.finish);
  const syncAnswers = useAnswerSync(backend);

  const completion = useMutation({
    mutationFn: async (sessionId: string) => {
      await syncAnswers();
      return backend.finish(sessionId);
    },
    onSuccess: (sessionResult) => {
      finish(sessionResult);
      void queryClient.invalidateQueries({ queryKey: studyKeys.dueLists });
      onFinished?.();
    },
    onError: (error) => {
      if (snapshotKey && error instanceof HttpError && STALE_SESSION_STATUSES.has(error.status)) {
        clearSnapshot(snapshotKey);
        void started.refetch();
      }
    },
  });
  const { mutate: complete, isIdle: canComplete, reset: resetCompletion } = completion;

  const data = started.isFetching ? undefined : started.data;
  const ready = data !== undefined && session?.id === data.session.id;
  const isLastAnswered = ready && questions.length > 0 && position >= questions.length;

  useEffect(() => {
    if (data && data.session.id !== useStudyStore.getState().session?.id) {
      begin(data, { snapshotKey, progress: data.progress });
      resetCompletion();
    }
  }, [begin, data, resetCompletion, snapshotKey]);

  useEffect(() => {
    if (isLastAnswered && !result && canComplete && session) {
      complete(session.id);
    }
  }, [canComplete, complete, isLastAnswered, result, session]);

  useEffect(() => {
    if (pendingCount >= BACKGROUND_SYNC_SIZE) {
      // Lỗi ở đây không chặn việc học, đáp án sẽ được gửi lại ở lần sau.
      syncAnswers().catch(() => undefined);
    }
  }, [pendingCount, syncAnswers]);

  // Rời trang giữa chừng vẫn cố lưu những gì đã trả lời.
  useEffect(() => () => void syncAnswers().catch(() => undefined), [syncAnswers]);

  useEffect(() => {
    const flush = () => void syncAnswers().catch(() => undefined);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [syncAnswers]);

  const startCode =
    started.isError && started.error instanceof HttpError ? started.error.code : null;
  const isUnavailable =
    Boolean(onUnavailable) && startCode !== null && UNAVAILABLE_CODES.has(startCode);
  useEffect(() => {
    if (isUnavailable) {
      onUnavailable?.();
    }
  }, [isUnavailable, onUnavailable]);

  useEffect(() => {
    return () => {
      useStudyStore.setState({ session: null, result: null, questions: [], position: 0 });
    };
  }, []);

  const total = ready ? questions.length : 0;
  const frame = (children: ReactNode) => (
    <StudyFrame
      exitHref={exitHref}
      onExit={onExit}
      position={Math.min(position, total)}
      total={total}
      header={header}
    >
      {children}
    </StudyFrame>
  );

  if (started.isError && !started.isFetching) {
    return frame(
      <StartFailure
        error={started.error}
        exitHref={exitHref}
        onExit={onExit}
        onRetry={() => void started.refetch()}
      />,
    );
  }
  if (!ready) {
    return frame(
      <LoadingState label={t('shell.preparing')}>
        <Skeleton className="h-64 w-full" />
      </LoadingState>,
    );
  }
  if (result) {
    return frame(
      <StudyResult
        result={result}
        questions={questions}
        exitHref={exitHref}
        exitLabel={exitLabel}
        onExit={onExit}
        note={resultNote}
        onRestart={() => void started.refetch()}
        onRetryWrong={() => {
          retryCardIds.current = result.wrongCardIds;
          void started.refetch();
        }}
      />,
    );
  }
  if (completion.isError) {
    return frame(
      <ErrorState
        title={t('shell.saveFailed')}
        description={t('shell.saveFailedHint')}
        onRetry={() => complete(data.session.id)}
      />,
    );
  }

  const question = questions[position];
  const View = STUDY_VIEWS[mode];
  if (!question || !View) {
    return frame(
      <LoadingState label={t('shell.saving')}>
        <Skeleton className="h-64 w-full" />
      </LoadingState>,
    );
  }

  return frame(
    <View
      key={question.id}
      question={question}
      languages={languages}
      onAnswer={answer}
      onSkip={skip}
      sessionId={session?.id}
      setId={session?.setId}
      onChecked={record}
      round={questions.slice(position, position + (STUDY_ROUND_SIZE[mode] ?? 1))}
    />,
  );
}
