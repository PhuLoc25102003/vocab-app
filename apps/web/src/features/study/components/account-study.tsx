'use client';

import { STUDY_MODE_LABELS, type StudyMode } from '@vocab/shared';
import { ArrowRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { accountStudyBackend } from '../api';
import { chainHref, clearReviewCards, loadReviewCards, saveReviewCards } from '../review-chain';
import { useStudyStore } from '../session.store';
import { StudyShell } from './study-shell';

interface AccountStudyProps {
  setId: string;
  mode: StudyMode;
  dueOnly: boolean;
  /** Các chế độ ôn tiếp theo, theo thứ tự (việc 5.28). */
  next?: StudyMode[];
  /** Chế độ thứ hai trở đi khi ôn nhiều chế độ: học lại đúng các thẻ của phiên đầu. */
  review?: boolean;
}

function NextReviewMode({ setId, next }: { setId: string; next: StudyMode[] }) {
  const [first] = next;
  if (!first) return null;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <p className="text-small text-text-muted">
        Còn <span className="tabular-nums">{next.length}</span> chế độ ôn với các thẻ này.
      </p>
      <Button asChild className="self-start">
        <Link
          href={chainHref(setId, next)}
          onClick={() =>
            saveReviewCards(
              setId,
              useStudyStore.getState().questions.map(({ cardId }) => cardId),
            )
          }
        >
          Chế độ tiếp: {STUDY_MODE_LABELS[first]}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export function AccountStudy({
  setId,
  mode,
  dueOnly,
  next = [],
  review = false,
}: AccountStudyProps) {
  const router = useRouter();
  // Đọc một lần khi mở trang; không có thì ôn thẻ đến hạn như bình thường.
  const [cardIds] = useState(() => {
    // Lượt ôn mới bắt đầu từ thẻ đến hạn: bỏ danh sách thẻ của lượt trước.
    if (dueOnly) clearReviewCards(setId);
    return (review ? loadReviewCards(setId) : null) ?? undefined;
  });
  const fromReview = dueOnly || review;

  const skip = useCallback(() => {
    toast.info(`Bỏ qua ${STUDY_MODE_LABELS[mode]}: chế độ này chưa dùng được với bộ từ.`);
    router.replace(chainHref(setId, next));
  }, [mode, next, router, setId]);

  return (
    <StudyShell
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      dueOnly={dueOnly || (review && !cardIds)}
      cardIds={cardIds}
      exitHref={(fromReview ? '/review' : `/sets/${setId}`) as Route}
      exitLabel={fromReview ? 'Về Ôn hôm nay' : undefined}
      resultNote={next.length ? <NextReviewMode setId={setId} next={next} /> : undefined}
      onUnavailable={next.length ? skip : undefined}
    />
  );
}
