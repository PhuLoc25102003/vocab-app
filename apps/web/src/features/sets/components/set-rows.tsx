import type { SetSummary } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { VISIBILITY_LABELS } from '../labels';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function SetRows({ sets }: { sets: SetSummary[] }) {
  return (
    <ul className="border-t border-border">
      {sets.map(({ id, title, visibility, cardCount, updatedAt }) => (
        <li
          key={id}
          className="relative flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-2 py-3 transition-colors duration-fast ease-standard hover:bg-primary-soft"
        >
          <div className="min-w-0 flex-1 basis-56">
            <Link
              href={`/sets/${id}/edit` as Route}
              className="block text-h3 break-words after:absolute after:inset-0"
            >
              {title}
            </Link>
            <p className="text-small text-text-muted">
              Cập nhật <time dateTime={updatedAt}>{dateFormat.format(new Date(updatedAt))}</time>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
              {VISIBILITY_LABELS[visibility]}
            </span>
            <span className="text-small tabular-nums">{cardCount} thẻ</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SetRowsLoading({ count }: { count: number }) {
  return (
    <LoadingState label="Đang tải bộ từ">
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </LoadingState>
  );
}
