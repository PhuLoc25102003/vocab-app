import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingState } from './loading-state';

/** Lưới 1, 2, 3 cột cho thẻ bộ từ ở mọi trang. */
export function SetCardList({ children }: { children: ReactNode }) {
  return <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>;
}

interface SetCardShellProps {
  href: Route;
  title: string;
  /** Góc trên bên trái, ví dụ nhãn phạm vi hoặc "Đến hạn". */
  badge?: ReactNode;
  /** Góc trên bên phải, ví dụ số thẻ. */
  count: ReactNode;
  description?: string | null;
  /** Hàng cuối bên trái: ngày cập nhật, tác giả... */
  footer?: ReactNode;
  /** Hàng cuối bên phải, nằm trên lớp link nên bấm được riêng. */
  actions?: ReactNode;
  /** Thuộc tính thêm cho thẻ, ví dụ để kéo thả. */
  itemProps?: Record<string, unknown>;
}

/**
 * Khung thẻ bộ từ dùng chung để bộ từ trông giống nhau ở Bộ từ, Khám phá, Tổng quan và Ôn hôm nay.
 * Cả thẻ bấm được nhờ link phủ toàn thẻ.
 */
export function SetCardShell({
  href,
  title,
  badge,
  count,
  description,
  footer,
  actions,
  itemProps,
}: SetCardShellProps) {
  return (
    <li
      {...itemProps}
      className="relative flex min-h-40 flex-col gap-2 rounded-md border border-border-strong bg-surface p-4 transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary-soft"
    >
      <div className="flex min-h-7 items-center justify-between gap-2 text-small">
        {badge ?? <span />}
        <span className="flex shrink-0 items-center gap-1 tabular-nums text-text-muted">
          {count}
        </span>
      </div>
      <Link
        href={href}
        className="line-clamp-2 min-h-11 text-h3 wrap-anywhere after:absolute after:inset-0 after:rounded-md"
      >
        {title}
      </Link>
      {description ? (
        <p className="line-clamp-2 text-small wrap-anywhere text-text-muted">{description}</p>
      ) : null}
      <div className="mt-auto flex min-h-11 items-center justify-between gap-3 text-small text-text-muted">
        {footer ?? <span />}
        {actions ? <div className="relative z-10 flex items-center gap-2">{actions}</div> : null}
      </div>
    </li>
  );
}

export function SetCardsSkeleton({ count, label }: { count: number; label: string }) {
  return (
    <LoadingState label={label}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
    </LoadingState>
  );
}
