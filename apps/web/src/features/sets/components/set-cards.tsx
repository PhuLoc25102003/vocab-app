import type { PublicSetSummary, SetSummary } from '@vocab/shared';
import { Layers } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { VISIBILITY_LABELS } from '../labels';

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export type SetCardData = SetSummary & Partial<Pick<PublicSetSummary, 'owner'>>;

interface SetCardGridProps<T extends SetCardData> {
  sets: T[];
  /** `library`: bộ của mình, hiện phạm vi và ngày cập nhật. `community`: hiện tác giả. */
  variant?: 'library' | 'community';
  hrefFor?: (id: string) => Route;
  /** Thao tác trên từng thẻ, ví dụ menu thư mục. Nằm trên lớp link nên bấm được riêng. */
  renderActions?: (set: T) => ReactNode;
  /** Gắn thêm thuộc tính cho từng thẻ, ví dụ để kéo thả. */
  itemProps?: (set: T) => Record<string, unknown>;
}

const memberSetHref = (id: string) => `/sets/${id}` as Route;

function OwnerLine({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('vi') || '?';
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-tiny font-semibold text-primary-fg"
      >
        {initial}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Lưới thẻ bộ từ dùng chung cho Bộ từ, Khám phá và Tổng quan. */
export function SetCardGrid<T extends SetCardData>({
  sets,
  variant = 'library',
  hrefFor = memberSetHref,
  renderActions,
  itemProps,
}: SetCardGridProps<T>) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => {
        const { id, title, description, cardCount, visibility, updatedAt, owner } = set;
        return (
          <li
            key={id}
            {...itemProps?.(set)}
            className="relative flex min-h-40 flex-col gap-2 rounded-md border border-border-strong bg-surface p-4 transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary-soft"
          >
            <div className="flex min-h-7 items-center justify-between gap-2 text-small">
              {variant === 'library' ? (
                <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
                  {VISIBILITY_LABELS[visibility]}
                </span>
              ) : (
                <span />
              )}
              <span className="flex shrink-0 items-center gap-1 tabular-nums text-text-muted">
                <Layers aria-hidden className="size-4" />
                {cardCount} thẻ
              </span>
            </div>
            <Link
              href={hrefFor(id)}
              className="line-clamp-2 text-h3 wrap-anywhere after:absolute after:inset-0 after:rounded-md"
            >
              {title}
            </Link>
            {description ? (
              <p className="line-clamp-2 text-small wrap-anywhere text-text-muted">{description}</p>
            ) : null}
            <div className="mt-auto flex min-h-11 items-center justify-between gap-3 text-small text-text-muted">
              {variant === 'community' && owner ? (
                <OwnerLine name={owner.displayName} />
              ) : (
                <span>
                  Cập nhật{' '}
                  <time dateTime={updatedAt}>{dateFormat.format(new Date(updatedAt))}</time>
                </span>
              )}
              {renderActions ? <div className="relative z-10">{renderActions(set)}</div> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SetCardsLoading({ count }: { count: number }) {
  return (
    <LoadingState label="Đang tải bộ từ">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
    </LoadingState>
  );
}
