import type { PublicSetSummary, SetSummary } from '@vocab/shared';
import { Layers } from 'lucide-react';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { SetCardList, SetCardShell, SetCardsSkeleton } from '@/components/common/set-card-shell';
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

/** Lưới thẻ bộ từ cho Bộ từ, Khám phá và Tổng quan, dùng khung chung `SetCardShell`. */
export function SetCardGrid<T extends SetCardData>({
  sets,
  variant = 'library',
  hrefFor = memberSetHref,
  renderActions,
  itemProps,
}: SetCardGridProps<T>) {
  return (
    <SetCardList>
      {sets.map((set) => {
        const { id, title, description, cardCount, visibility, updatedAt, owner } = set;
        return (
          <SetCardShell
            key={id}
            href={hrefFor(id)}
            title={title}
            description={description}
            itemProps={itemProps?.(set)}
            badge={
              variant === 'library' ? (
                <span className="rounded-sm bg-primary-soft px-2 text-tiny text-primary">
                  {VISIBILITY_LABELS[visibility]}
                </span>
              ) : undefined
            }
            count={
              <>
                <Layers aria-hidden className="size-4" />
                {cardCount} thẻ
              </>
            }
            footer={
              variant === 'community' && owner ? (
                <OwnerLine name={owner.displayName} />
              ) : (
                <span title="Cập nhật">
                  <span className="sr-only">Cập nhật </span>
                  <time dateTime={updatedAt}>{dateFormat.format(new Date(updatedAt))}</time>
                </span>
              )
            }
            actions={renderActions?.(set)}
          />
        );
      })}
    </SetCardList>
  );
}

export function SetCardsLoading({ count }: { count: number }) {
  return <SetCardsSkeleton count={count} label="Đang tải bộ từ" />;
}
