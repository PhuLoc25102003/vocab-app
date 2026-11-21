import type { AssignmentStatus, ProgressStatus } from '@vocab/shared';
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS: Record<AssignmentStatus, { label: string; icon: LucideIcon; className: string }> = {
  done: { label: 'Đã làm', icon: CircleCheck, className: 'text-success' },
  pending: { label: 'Chưa làm', icon: CircleDashed, className: 'text-text-muted' },
  overdue: { label: 'Quá hạn', icon: CircleAlert, className: 'text-danger' },
};

/** Trạng thái bài của học sinh theo bài nộp, màu và icon theo `docs/use-cases/06-vai-tro-va-lop-hoc.md`. */
export const PROGRESS_STATUS: Record<
  ProgressStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  todo: { label: 'Chưa làm', icon: CircleDashed, className: 'text-text-muted' },
  in_progress: { label: 'Đang làm', icon: CircleDot, className: 'text-primary' },
  submitted: { label: 'Đã nộp', icon: CircleCheck, className: 'text-success' },
  late: { label: 'Nộp trễ', icon: Clock, className: 'text-warning' },
  missed: { label: 'Bỏ lỡ', icon: CircleAlert, className: 'text-danger' },
};

export function StatusLabel({ status }: { status: AssignmentStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span className={cn('flex items-center gap-1 font-medium', className)}>
      <Icon aria-hidden className="size-4 shrink-0" />
      {label}
    </span>
  );
}

export const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;
