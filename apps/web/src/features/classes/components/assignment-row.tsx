import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Một dòng bài tập dùng chung cho học sinh và giáo viên (việc 5.31): nhãn trạng thái bên trái,
 * tên bộ và dòng phụ ở giữa, cả dòng là một link. Dòng phụ do nơi dùng truyền vào.
 */
export function AssignmentRow({
  href,
  status,
  title,
  children,
  action,
}: {
  href: Route;
  status: { label: string; icon: LucideIcon; className: string };
  title: string;
  /** Dòng phụ: lớp, chế độ, hạn, số đã nộp. */
  children?: ReactNode;
  /** Nút cạnh link, ví dụ huỷ bài giao; nằm ngoài link để bấm riêng được. */
  action?: ReactNode;
}) {
  const { label, icon: Icon, className } = status;
  return (
    <li className="flex items-center gap-1 border-b border-border last:border-b-0">
      <Link
        href={href}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 transition-colors duration-fast ease-standard hover:bg-primary-soft sm:px-2"
      >
        <span
          className={cn('flex w-24 shrink-0 items-center gap-1 text-small font-medium', className)}
        >
          <Icon aria-hidden className="size-4 shrink-0" />
          {label}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-medium wrap-anywhere">{title}</span>
          {children ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-text-muted">
              {children}
            </span>
          ) : null}
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-text-muted" />
      </Link>
      {action}
    </li>
  );
}
