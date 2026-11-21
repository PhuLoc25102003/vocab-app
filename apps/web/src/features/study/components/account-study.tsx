'use client';

import type { StudyMode } from '@vocab/shared';
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
import { Trans, useTranslation } from 'react-i18next';

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
  const { t } = useTranslation(['study', 'common']);
  const [first] = next;
  if (!first) return null;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <p className="text-small text-text-muted">
        <Trans
          t={t}
          i18nKey="chain.remaining"
          values={{ count: next.length }}
          components={[<span key="c" className="tabular-nums" />]}
        />
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
          {t('chain.mode', { mode: t(`common:modes.${first}`) })}
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
  const { t } = useTranslation(['study', 'common']);
  const router = useRouter();
  // Đọc một lần khi mở trang; không có thì ôn thẻ đến hạn như bình thường.
  const [cardIds] = useState(() => {
    // Lượt ôn mới bắt đầu từ thẻ đến hạn: bỏ danh sách thẻ của lượt trước.
    if (dueOnly) clearReviewCards(setId);
    return (review ? loadReviewCards(setId) : null) ?? undefined;
  });
  const fromReview = dueOnly || review;

  const skip = useCallback(() => {
    toast.info(t('chain.skipped', { mode: t(`common:modes.${mode}`) }));
    router.replace(chainHref(setId, next));
  }, [mode, next, router, setId, t]);

  return (
    <StudyShell
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      dueOnly={dueOnly || (review && !cardIds)}
      cardIds={cardIds}
      exitHref={(fromReview ? '/review' : `/sets/${setId}`) as Route}
      exitLabel={fromReview ? t('chain.backToReview') : undefined}
      resultNote={next.length ? <NextReviewMode setId={setId} next={next} /> : undefined}
      onUnavailable={next.length ? skip : undefined}
    />
  );
}
