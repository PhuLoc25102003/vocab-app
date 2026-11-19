'use client';

import { useQuery } from '@tanstack/react-query';
import { paginationSchema } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SelectField } from '@/components/common/form-field';
import { LoadingState } from '@/components/common/loading-state';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { listDueSets } from '../api';
import { studyKeys } from '../query-keys';

export const DUE_PAGE_SIZE = 20;

export function DueSetsLoading() {
  return (
    <LoadingState label="Đang tải thẻ cần ôn">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </LoadingState>
  );
}

function pageHref(page: number): Route {
  return (page === 1 ? '/review' : `/review?page=${page}`) as Route;
}

const REVIEW_MODES = [
  { slug: 'flashcard', label: 'Flashcard' },
  { slug: 'write', label: 'Viết' },
  { slug: 'dictation', label: 'Nghe viết' },
  { slug: 'mcq', label: 'Trắc nghiệm' },
  { slug: 'cloze', label: 'Điền từ' },
];

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
      <EmptyState
        title="Hôm nay chưa có từ cần ôn"
        description="Học thêm một bộ từ, các từ đến hạn ôn sẽ hiện ở đây."
        action={
          <Button asChild variant="secondary">
            <Link href="/sets">Xem bộ từ</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <p className="text-text-muted">
        Bạn có <span className="font-semibold text-text tabular-nums">{summary.dueCards}</span> thẻ
        cần ôn.
      </p>
      <div className="max-w-60">
        <SelectField
          label="Ôn bằng chế độ"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          {REVIEW_MODES.map(({ slug, label }) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
      <ul className="border-t border-border">
        {data.map(({ setId, title, dueCount }) => (
          <li
            key={setId}
            className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3"
          >
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-h3 break-words">{title}</p>
              <p className="text-small text-text-muted tabular-nums">{dueCount} thẻ đến hạn</p>
            </div>
            <Button asChild>
              <Link
                href={`/sets/${setId}/study/${mode}?due=1` as Route}
                aria-label={`Ôn bộ từ ${title}`}
              >
                Ôn ngay
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <Pagination
        page={meta.page}
        pageCount={Math.ceil(meta.total / meta.limit)}
        hrefFor={pageHref}
      />
    </>
  );
}
