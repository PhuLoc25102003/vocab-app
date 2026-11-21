'use client';

import { useQuery } from '@tanstack/react-query';
import { paginationSchema, type StudyMode } from '@vocab/shared';
import { CalendarClock, Check, ChevronDown, Info, Play } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { SetCardList, SetCardShell, SetCardsSkeleton } from '@/components/common/set-card-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { listDueSets } from '../api';
import { loadReviewModes, REVIEW_MODES, reviewHref, saveReviewModes } from '../review-chain';
import { cn } from '@/lib/utils';
import { studyKeys } from '../query-keys';
import { Trans, useTranslation } from 'react-i18next';

export const DUE_PAGE_SIZE = 20;

export function DueSetsLoading() {
  const { t } = useTranslation(['study', 'common']);
  return (
    <LoadingState label={t('review.loading')}>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <SetCardsSkeleton count={2} label={t('review.loadingSets')} />
      </div>
    </LoadingState>
  );
}

function pageHref(page: number): Route {
  return (page === 1 ? '/review' : `/review?page=${page}`) as Route;
}

const formatDueTime = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    hour: locale === 'en' ? 'numeric' : '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hour12: locale === 'en',
  }).format(date);

const SCHEDULE_STEPS = ['wrong', 'first', 'second', 'later'] as const;

/**
 * Giải thích vì sao thẻ xuất hiện ở đây. Trông như một nút (icon, viền, mũi tên xoay khi mở)
 * để người học nhận ra bấm được.
 */
function ScheduleNote() {
  const { t } = useTranslation(['study', 'common']);
  return (
    <details className="group rounded-md border border-border-strong bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-md px-4 font-medium transition-colors duration-fast ease-standard hover:bg-primary-soft [&::-webkit-details-marker]:hidden">
        <Info aria-hidden className="size-5 shrink-0 text-primary" />
        <span className="flex-1">{t('review.whenDue')}</span>
        <span className="hidden text-small font-normal text-text-muted group-open:hidden sm:inline">
          {t('review.howItWorks')}
        </span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-text-muted transition-transform duration-fast ease-standard group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ol className="grid gap-3 border-t border-border p-4 text-small sm:grid-cols-2">
        {SCHEDULE_STEPS.map((step) => (
          <li key={step} className="flex flex-col gap-0.5">
            <span className="font-medium">{t(`review.schedule.${step}.when`)}</span>
            <span className="text-text-muted">{t(`review.schedule.${step}.then`)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

interface ReviewSummaryProps {
  dueCards: number;
  setCount: number;
  modes: StudyMode[];
  onModesChange: (modes: StudyMode[]) => void;
  first: { setId: string; title: string } | undefined;
}

/** Khối tóm tắt nền bảng xanh: số thẻ cần ôn cỡ lớn, chọn chế độ và nút ôn ngay. */
/** Chọn một, nhiều hoặc tất cả chế độ; số thứ tự là thứ tự ôn (việc 5.28). */
function ReviewModePicker({
  modes,
  onModesChange,
}: {
  modes: StudyMode[];
  onModesChange: (modes: StudyMode[]) => void;
}) {
  const { t } = useTranslation(['study', 'common']);
  const toggle = (mode: StudyMode) =>
    onModesChange(
      modes.includes(mode)
        ? modes.length > 1
          ? modes.filter((item) => item !== mode)
          : modes
        : [...modes, mode],
    );
  const all = modes.length === REVIEW_MODES.length;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-small font-medium text-board-fg">
        {t('review.modesLegend')}
      </legend>
      <div className="flex flex-wrap gap-2">
        {REVIEW_MODES.map((mode) => {
          const order = modes.indexOf(mode);
          const on = order >= 0;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(mode)}
              className={cn(
                'flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-small font-medium transition-colors duration-fast ease-standard',
                on
                  ? 'border-board-fg bg-board-fg text-board'
                  : 'border-board-muted text-board-fg hover:border-board-fg',
              )}
            >
              {on ? (
                <span aria-hidden className="tabular-nums">
                  {order + 1}.
                </span>
              ) : null}
              {t(`common:modes.${mode}`)}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={all}
          onClick={() => onModesChange(all ? ['FLASHCARD'] : [...REVIEW_MODES])}
          className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-small font-medium text-board-fg underline underline-offset-4"
        >
          {all ? null : <Check aria-hidden className="size-4" />}
          {t(all ? 'review.onlyFlashcard' : 'review.selectAll')}
        </button>
      </div>
    </fieldset>
  );
}

function ReviewSummary({ dueCards, setCount, modes, onModesChange, first }: ReviewSummaryProps) {
  const { t } = useTranslation(['study', 'common']);
  return (
    <section
      aria-labelledby="review-summary"
      className="flex flex-col gap-6 rounded-lg bg-board p-6 text-board-fg md:flex-row md:items-end md:justify-between md:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="review-summary" className="text-small font-medium text-board-muted">
          {t('review.dueToday')}
        </h2>
        <p className="flex items-baseline gap-3">
          <span className="text-card tabular-nums">{dueCards}</span>
          <span className="text-h3">{t('review.cards')}</span>
        </p>
        <p className="text-board-muted">
          <Trans
            t={t}
            i18nKey="review.inSets"
            values={{ count: setCount }}
            components={[<span key="c" className="tabular-nums" />]}
          />
        </p>
      </div>
      <div className="flex flex-col items-start gap-4 md:max-w-[560px]">
        <ReviewModePicker modes={modes} onModesChange={onModesChange} />
        {first ? (
          <Button asChild className="bg-board-fg text-board hover:bg-surface">
            <Link href={reviewHref(first.setId, modes)}>
              <Play aria-hidden className="size-4" />
              {t('review.startFirst')}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function DueSets() {
  const { t, i18n } = useTranslation(['study', 'common']);
  const [modes, setModesState] = useState<StudyMode[]>(['FLASHCARD']);
  useEffect(() => {
    // Đọc lựa chọn đã lưu sau khi hiện để HTML từ máy chủ và trình duyệt giống nhau.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc localStorage một lần
    setModesState(loadReviewModes());
  }, []);
  const setModes = (next: StudyMode[]) => {
    setModesState(next);
    saveReviewModes(next);
  };
  const parsedPage = paginationSchema.shape.page.safeParse(useSearchParams().get('page'));
  const page = parsedPage.success ? parsedPage.data : 1;
  const due = useQuery({
    queryKey: studyKeys.due(page),
    queryFn: () => listDueSets({ page, limit: DUE_PAGE_SIZE }),
    staleTime: 0,
  });

  if (due.isPending) {
    return <DueSetsLoading />;
  }
  if (due.isError) {
    return (
      <ErrorState
        title={t('review.loadFailed')}
        description={t('shell.checkNetwork')}
        onRetry={() => void due.refetch()}
      />
    );
  }

  const { data, meta, summary } = due.data;
  if (summary.dueCards === 0) {
    return (
      <>
        <EmptyState
          title={t('review.nothing')}
          description={
            summary.nextDueAt
              ? t('review.nextDue', { time: formatDueTime(summary.nextDueAt, i18n.language) })
              : t('review.nothingHint')
          }
          action={
            <Button asChild variant="secondary">
              <Link href="/sets">{t('review.seeSets')}</Link>
            </Button>
          }
        />
        <ScheduleNote />
      </>
    );
  }

  return (
    <>
      <ReviewSummary
        dueCards={summary.dueCards}
        setCount={meta.total}
        modes={modes}
        onModesChange={setModes}
        first={data[0]}
      />
      <ScheduleNote />
      <section aria-labelledby="due-sets" className="flex flex-col gap-4">
        <h2 id="due-sets" className="text-h2">
          {t('review.setsWithDue')}
        </h2>
        <SetCardList>
          {data.map(({ setId, title, dueCount }) => (
            <SetCardShell
              key={setId}
              href={`/sets/${setId}` as Route}
              title={title}
              badge={
                <span className="flex items-center gap-1 rounded-sm bg-primary-soft px-2 text-tiny text-primary">
                  <CalendarClock aria-hidden className="size-3.5" />
                  {t('review.due')}
                </span>
              }
              count={
                <span className="font-medium text-text">
                  {t('review.dueCount', { count: dueCount })}
                </span>
              }
              actions={
                <Button asChild>
                  <Link
                    href={reviewHref(setId, modes)}
                    aria-label={t('review.reviewSet', { title })}
                  >
                    {t('review.now')}
                  </Link>
                </Button>
              }
            />
          ))}
        </SetCardList>
      </section>
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={pageHref}
      />
    </>
  );
}
