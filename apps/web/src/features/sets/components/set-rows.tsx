import type { SetSummary, Visibility } from '@vocab/shared';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';

const VISIBILITY_LABELS: Record<Visibility, string> = {
  PRIVATE: 'Riêng tư',
  CLASS: 'Lớp học',
  PUBLIC: 'Công khai',
};

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
          className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-3"
        >
          <div className="min-w-0 flex-1 basis-56">
            <p className="text-h3 break-words">{title}</p>
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
