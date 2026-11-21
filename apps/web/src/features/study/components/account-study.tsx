'use client';

import type { StudyMode } from '@vocab/shared';
import { ArrowRight, Check, PartyPopper } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountStudyBackend } from '../api';
import {
  chainHref,
  clearReviewCards,
  clearReviewChain,
  loadReviewCards,
  parseReviewChain,
  readReviewChainRaw,
  saveReviewCards,
  saveReviewChain,
} from '../review-chain';

// sessionStorage không phát sự kiện trong cùng tab; chỉ cần đọc lại sau hydrate.
const subscribeNoop = () => () => {};
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

/** Thanh bước trên đầu phiên học khi ôn nhiều chế độ nối tiếp (UC-L10). */
function ReviewSteps({ chain, current }: { chain: StudyMode[]; current: StudyMode }) {
  const { t } = useTranslation(['study', 'common']);
  const currentIndex = chain.indexOf(current);
  return (
    <ol aria-label={t('chain.steps')} className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-1">
      {chain.map((stepMode, index) => {
        const done = currentIndex >= 0 ? index < currentIndex : false;
        const active = index === currentIndex;
        return (
          <li
            key={stepMode}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-small',
              done && 'border-primary bg-primary-soft text-primary',
              active && 'border-primary bg-primary font-semibold text-primary-fg',
              !done && !active && 'border-border text-text-muted',
            )}
          >
            {done ? (
              <Check aria-hidden className="size-3.5" />
            ) : (
              <span aria-hidden className="tabular-nums">
                {index + 1}
              </span>
            )}
            {t(`common:modes.${stepMode}`)}
            {done ? <span className="sr-only">{t('path.done')}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function NextReviewMode({
  setId,
  next,
  onProceed,
}: {
  setId: string;
  next: StudyMode[];
  onProceed: () => void;
}) {
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
          components={[<span key="c" className="font-semibold text-text tabular-nums" />]}
        />
      </p>
      <Button asChild className="self-start">
        <Link href={chainHref(setId, next)} onClick={onProceed}>
          {t('chain.mode', { mode: t(`common:modes.${first}`) })}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function ReviewFinished() {
  const { t } = useTranslation('study');
  return (
    <p className="flex items-center gap-2 rounded-md border border-primary bg-primary-soft p-3 font-medium text-primary">
      <PartyPopper aria-hidden className="size-5 shrink-0" />
      {t('chain.finished')}
    </p>
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
  const fromReview = dueOnly || review;

  // Lượt ôn mới bắt đầu từ thẻ đến hạn: xoá danh sách thẻ cũ và lưu toàn bộ chuỗi chế độ.
  // Lượt ôn tiếp theo (review): đọc danh sách thẻ và danh sách chuỗi đã lưu từ phiên đầu.
  const [cardIds] = useState(() => {
    if (dueOnly) {
      clearReviewCards(setId);
      if (next.length > 0) {
        saveReviewChain(setId, [mode, ...next]);
      } else {
        clearReviewChain(setId);
      }
      return undefined;
    }
    return (review ? loadReviewCards(setId) : null) ?? undefined;
  });

  // Server không có sessionStorage: trả null để lần render đầu khớp, client đọc lại sau hydrate.
  const savedChainRaw = useSyncExternalStore(
    subscribeNoop,
    () => readReviewChainRaw(setId),
    () => null,
  );

  const chain = useMemo(() => {
    if (!fromReview) return null;
    const saved = parseReviewChain(savedChainRaw);
    if (saved && saved.length > 1) return saved;
    if (next.length > 0) return [mode, ...next];
    return null;
  }, [fromReview, mode, next, savedChainRaw]);

  const persistCards = useCallback(() => {
    const questions = useStudyStore.getState().questions;
    if (questions.length > 0) {
      saveReviewCards(
        setId,
        questions.map(({ cardId }) => cardId),
      );
    }
  }, [setId]);

  const handleFinished = useCallback(() => {
    persistCards();
    if (review && next.length === 0) {
      clearReviewCards(setId);
      clearReviewChain(setId);
    }
  }, [next.length, persistCards, review, setId]);

  const skip = useCallback(() => {
    toast.info(t('chain.skipped', { mode: t(`common:modes.${mode}`) }));
    router.replace(chainHref(setId, next));
  }, [mode, next, router, setId, t]);

  const resultNote = next.length ? (
    <NextReviewMode setId={setId} next={next} onProceed={persistCards} />
  ) : fromReview && chain && chain.length > 1 ? (
    <ReviewFinished />
  ) : undefined;

  return (
    <StudyShell
      key={`${setId}-${mode}-${review ? 'review' : 'due'}`}
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      dueOnly={dueOnly || (review && !cardIds)}
      cardIds={cardIds}
      exitHref={(fromReview ? '/review' : `/sets/${setId}`) as Route}
      exitLabel={fromReview ? t('chain.backToReview') : undefined}
      header={chain && chain.length > 1 ? <ReviewSteps chain={chain} current={mode} /> : undefined}
      resultNote={resultNote}
      onFinished={handleFinished}
      onUnavailable={next.length ? skip : undefined}
    />
  );
}
