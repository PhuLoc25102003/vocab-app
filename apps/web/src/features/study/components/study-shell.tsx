'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ERROR_CODES, type StudyMode } from '@vocab/shared';
import { X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HttpError } from '@/lib/http';
import type { StudyBackend } from '../api';
import { useAnswerSync } from '../hooks/use-answer-sync';
import { STUDY_VIEWS } from '../modes/views';
import { useStudyStore } from '../session.store';
import { StudyResult } from './study-result';

const BACKGROUND_SYNC_SIZE = 10;

interface StudyShellProps {
  backend: StudyBackend;
  setId: string;
  mode: StudyMode;
  exitHref: Route;
  resultNote?: ReactNode;
}

function StudyFrame({
  exitHref,
  position,
  total,
  children,
}: {
  exitHref: Route;
  position: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-bg">
      <header className="mx-auto flex w-full max-w-[720px] items-center gap-3 px-4 py-2">
        <Button asChild variant="ghost" size="icon">
          <Link href={exitHref} aria-label="Thoát phiên học">
            <X aria-hidden className="size-5" />
          </Link>
        </Button>
        <div
          role="progressbar"
          aria-label="Tiến độ phiên học"
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
        <span className="text-small tabular-nums">
          {position}/{total}
        </span>
      </header>
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </div>
    </div>
  );
}

function StartFailure({
  error,
  exitHref,
  onRetry,
}: {
  error: unknown;
  exitHref: Route;
  onRetry: () => void;
}) {
  const code = error instanceof HttpError ? error.code : null;
  if (code === ERROR_CODES.SET_HAS_NO_CARDS || code === ERROR_CODES.SET_NOT_FOUND) {
    return (
      <EmptyState
        title={code === ERROR_CODES.SET_HAS_NO_CARDS ? 'Bộ từ chưa có thẻ' : 'Không tìm thấy bộ từ'}
        description={
          code === ERROR_CODES.SET_HAS_NO_CARDS
            ? 'Hãy thêm thẻ trước khi học.'
            : 'Bộ từ này đã bị xoá hoặc bạn không có quyền xem.'
        }
        action={
          <Button asChild variant="secondary">
            <Link href={exitHref}>Quay lại</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ErrorState
      title="Không bắt đầu được phiên học"
      description="Hãy kiểm tra mạng rồi thử lại."
      onRetry={onRetry}
    />
  );
}

export function StudyShell({ backend, setId, mode, exitHref, resultNote }: StudyShellProps) {
  const started = useQuery({
    queryKey: ['study', 'session', setId, mode],
    queryFn: () => backend.start(setId, mode),
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
  const finish = useStudyStore((state) => state.finish);
  const syncAnswers = useAnswerSync(backend);

  const completion = useMutation({
    mutationFn: async (sessionId: string) => {
      await syncAnswers();
      return backend.finish(sessionId);
    },
    onSuccess: finish,
  });
  const { mutate: complete, isIdle: canComplete, reset: resetCompletion } = completion;

  const data = started.isFetching ? undefined : started.data;
  const ready = data !== undefined && session?.id === data.session.id;
  const isLastAnswered = ready && questions.length > 0 && position >= questions.length;

  useEffect(() => {
    if (data && data.session.id !== useStudyStore.getState().session?.id) {
      begin(data);
      resetCompletion();
    }
  }, [begin, data, resetCompletion]);

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

  const total = ready ? questions.length : 0;
  const frame = (children: ReactNode) => (
    <StudyFrame exitHref={exitHref} position={Math.min(position, total)} total={total}>
      {children}
    </StudyFrame>
  );

  if (started.isError && !started.isFetching) {
    return frame(
      <StartFailure
        error={started.error}
        exitHref={exitHref}
        onRetry={() => void started.refetch()}
      />,
    );
  }
  if (!ready) {
    return frame(
      <LoadingState label="Đang chuẩn bị phiên học">
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
        note={resultNote}
        onRestart={() => void started.refetch()}
      />,
    );
  }
  if (completion.isError) {
    return frame(
      <ErrorState
        title="Chưa lưu được kết quả"
        description="Đáp án của bạn vẫn còn. Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => complete(data.session.id)}
      />,
    );
  }

  const question = questions[position];
  const View = STUDY_VIEWS[mode];
  if (!question || !View) {
    return frame(
      <LoadingState label="Đang lưu kết quả">
        <Skeleton className="h-64 w-full" />
      </LoadingState>,
    );
  }

  return frame(
    <View key={question.id} question={question} languages={languages} onAnswer={answer} />,
  );
}
