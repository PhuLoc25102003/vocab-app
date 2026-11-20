'use client';

import { useQuery } from '@tanstack/react-query';
import { paginationSchema } from '@vocab/shared';
import { CalendarClock, ChevronDown, Info, Play } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SelectField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { SetCardList, SetCardShell, SetCardsSkeleton } from '@/components/common/set-card-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { listDueSets } from '../api';
import { studyKeys } from '../query-keys';

export const DUE_PAGE_SIZE = 20;

export function DueSetsLoading() {
  return (
    <LoadingState label="Đang tải thẻ cần ôn">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <SetCardsSkeleton count={2} label="Đang tải bộ từ có thẻ đến hạn" />
      </div>
    </LoadingState>
  );
}

function pageHref(page: number): Route {
  return (page === 1 ? '/review' : `/review?page=${page}`) as Route;
}

const REVIEW_MODES = [
  { slug: 'flashcard', label: 'Flashcard' },
  { slug: 'learn', label: 'Học kỹ' },
  { slug: 'write', label: 'Viết' },
  { slug: 'dictation', label: 'Nghe viết' },
  { slug: 'mcq', label: 'Trắc nghiệm' },
  { slug: 'cloze', label: 'Điền từ' },
  { slug: 'match', label: 'Ghép cặp' },
];

const dueFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

const SCHEDULE_STEPS = [
  { when: 'Trả lời sai', then: 'Thẻ quay lại sau 10 phút.' },
  { when: 'Đúng lần đầu', then: 'Hẹn ôn sau 1 ngày.' },
  { when: 'Đúng tiếp khi đến hạn', then: 'Giãn ra 6 ngày, từ được tính là đã thuộc.' },
  {
    when: 'Về sau',
    then: 'Khoảng cách tiếp tục tăng. Học lại trước hạn không làm thẻ tiến nhanh hơn.',
  },
];

/**
 * Giải thích vì sao thẻ xuất hiện ở đây. Trông như một nút (icon, viền, mũi tên xoay khi mở)
 * để người học nhận ra bấm được.
 */
function ScheduleNote() {
  return (
    <details className="group rounded-md border border-border-strong bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-md px-4 font-medium transition-colors duration-fast ease-standard hover:bg-primary-soft [&::-webkit-details-marker]:hidden">
        <Info aria-hidden className="size-5 shrink-0 text-primary" />
        <span className="flex-1">Khi nào thẻ đến hạn ôn?</span>
        <span className="hidden text-small font-normal text-text-muted group-open:hidden sm:inline">
          Xem cách tính
        </span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-text-muted transition-transform duration-fast ease-standard group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <ol className="grid gap-3 border-t border-border p-4 text-small sm:grid-cols-2">
        {SCHEDULE_STEPS.map(({ when, then }) => (
          <li key={when} className="flex flex-col gap-0.5">
            <span className="font-medium">{when}</span>
            <span className="text-text-muted">{then}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

interface ReviewSummaryProps {
  dueCards: number;
  setCount: number;
  mode: string;
  onModeChange: (mode: string) => void;
  first: { setId: string; title: string } | undefined;
}

/** Khối tóm tắt nền bảng xanh: số thẻ cần ôn cỡ lớn, chọn chế độ và nút ôn ngay. */
function ReviewSummary({ dueCards, setCount, mode, onModeChange, first }: ReviewSummaryProps) {
  return (
    <section
      aria-labelledby="review-summary"
      className="flex flex-col gap-6 rounded-lg bg-board p-6 text-board-fg md:flex-row md:items-end md:justify-between md:p-8"
    >
      <div className="flex flex-col gap-1">
        <h2 id="review-summary" className="text-small font-medium text-board-muted">
          Cần ôn hôm nay
        </h2>
        <p className="flex items-baseline gap-3">
          <span className="text-card tabular-nums">{dueCards}</span>
          <span className="text-h3">thẻ</span>
        </p>
        <p className="text-board-muted">
          trong <span className="tabular-nums">{setCount}</span> bộ từ. Ôn đúng hạn để nhớ lâu hơn.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-48 [&_label]:text-board-fg [&_select]:text-text">
          <SelectField
            label="Ôn bằng chế độ"
            value={mode}
            onChange={(event) => onModeChange(event.target.value)}
          >
            {REVIEW_MODES.map(({ slug, label }) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
        {first ? (
          <Button asChild className="bg-board-fg text-board hover:bg-surface">
            <Link href={`/sets/${first.setId}/study/${mode}?due=1` as Route}>
              <Play aria-hidden className="size-4" />
              Ôn bộ đầu tiên
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function DueSets() {
  const [mode, setMode] = useState(REVIEW_MODES[0]?.slug ?? 'flashcard');
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
        title="Không tải được thẻ cần ôn"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => void due.refetch()}
      />
    );
  }

  const { data, meta, summary } = due.data;
  if (summary.dueCards === 0) {
    return (
      <>
        <EmptyState
          title="Hôm nay chưa có từ cần ôn"
          description={
            summary.nextDueAt
              ? `Thẻ tiếp theo đến hạn lúc ${dueFormat.format(summary.nextDueAt)}.`
              : 'Học thêm một bộ từ, các từ đến hạn ôn sẽ hiện ở đây.'
          }
          action={
            <Button asChild variant="secondary">
              <Link href="/sets">Xem bộ từ</Link>
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
        mode={mode}
        onModeChange={setMode}
        first={data[0]}
      />
      <ScheduleNote />
      <section aria-labelledby="due-sets" className="flex flex-col gap-4">
        <h2 id="due-sets" className="text-h2">
          Bộ từ có thẻ đến hạn
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
                  Đến hạn
                </span>
              }
              count={<span className="font-medium text-text">{dueCount} thẻ đến hạn</span>}
              actions={
                <Button asChild>
                  <Link
                    href={`/sets/${setId}/study/${mode}?due=1` as Route}
                    aria-label={`Ôn bộ từ ${title}`}
                  >
                    Ôn ngay
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
