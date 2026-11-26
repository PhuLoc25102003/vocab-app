import type { Route } from 'next';
import Link from 'next/link';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { LoadingState } from './loading-state';

/**
 * Số cột theo bề rộng vùng chứa, không theo màn hình, để thẻ rộng gần bằng nhau ở mọi trang
 * (trang Bộ từ có cột thư mục nên hẹp hơn): 2 cột từ 448 px, 3 từ 768 px, 4 từ 1024 px.
 */
const GRID = 'grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4';

/** Lưới thẻ bộ từ ở mọi trang. */
export function SetCardList({ children }: { children: ReactNode }) {
  return (
    <div className="@container">
      <ul className={GRID}>{children}</ul>
    </div>
  );
}

export interface SetCardShellProps extends Omit<ComponentPropsWithoutRef<'li'>, 'contextMenu'> {
  href: Route;
  title: string;
  /** Đầu hàng thông tin cuối thẻ, ví dụ nhãn phạm vi hoặc "Đến hạn". */
  badge?: ReactNode;
  /** Sau nhãn, ví dụ số thẻ. */
  count: ReactNode;
  description?: string | null;
  /** Cuối hàng thông tin: ngày cập nhật, tác giả... Thiếu chỗ thì xuống dòng. */
  footer?: ReactNode;
  /** Góc trên bên phải cạnh tên, nằm trên lớp link nên bấm được riêng. */
  actions?: ReactNode;
  /** Menu chuột phải nổi khi thao tác trên thẻ. */
  contextMenu?: ReactNode;
  /** Thuộc tính thêm cho thẻ, ví dụ để kéo thả. */
  itemProps?: Record<string, unknown>;
}

/**
 * Khung thẻ bộ từ dùng chung để bộ từ trông giống nhau ở Bộ từ, Khám phá, Tổng quan và Ôn hôm nay.
 * Cả thẻ bấm được nhờ link phủ toàn thẻ.
 */
export const SetCardShell = forwardRef<HTMLLIElement, SetCardShellProps>(function SetCardShell(
  {
    href,
    title,
    badge,
    count,
    description,
    footer,
    actions,
    contextMenu,
    itemProps,
    className,
    ...rest
  },
  ref,
) {
  const card = (
    <li
      ref={ref}
      {...rest}
      {...itemProps}
      className={cn(
        'glass-surface relative flex min-h-28 flex-col gap-1 rounded-xl border border-border p-3.5 shadow-xs transition-all duration-fast ease-standard hover:border-primary/60 hover:bg-primary-soft hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {/* Link phủ cả thẻ; tự nó cũng cao tối thiểu 44 px để đạt vùng bấm. */}
        <Link
          href={href}
          title={title}
          draggable={false}
          className="line-clamp-2 min-h-11 min-w-0 flex-1 py-0.5 font-semibold wrap-anywhere after:absolute after:inset-0 after:rounded-md"
        >
          {title}
        </Link>
        {actions ? (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="relative z-10 -mt-1.5 -mr-1.5 flex shrink-0 items-center gap-1"
          >
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="line-clamp-1 text-small wrap-anywhere text-text-muted" title={description}>
          {description}
        </p>
      ) : null}
      <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-small text-text-muted">
        {badge}
        <span className="flex shrink-0 items-center gap-1 tabular-nums">{count}</span>
        {footer ? <span className="flex max-w-full min-w-0 items-center">{footer}</span> : null}
      </div>
    </li>
  );

  if (contextMenu) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
        {contextMenu}
      </ContextMenu>
    );
  }

  return card;
});

export function SetCardsSkeleton({ count, label }: { count: number; label: string }) {
  return (
    <LoadingState label={label}>
      <div className="@container">
        <div className={GRID}>
          {Array.from({ length: count }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      </div>
    </LoadingState>
  );
}
