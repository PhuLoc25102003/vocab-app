'use client';

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
import { useTranslation } from 'react-i18next';

const STATUS = {
  done: { label: 'status.done', icon: CircleCheck, className: 'text-success' },
  pending: { label: 'status.pending', icon: CircleDashed, className: 'text-text-muted' },
  overdue: { label: 'status.overdue', icon: CircleAlert, className: 'text-danger' },
} as const satisfies Record<
  AssignmentStatus,
  { label: string; icon: LucideIcon; className: string }
>;

/** Trạng thái bài của học sinh theo bài nộp, màu và icon theo `docs/use-cases/06-vai-tro-va-lop-hoc.md`. */
export const PROGRESS_STATUS = {
  todo: { label: 'progress.todo', icon: CircleDashed, className: 'text-text-muted' },
  in_progress: { label: 'progress.in_progress', icon: CircleDot, className: 'text-primary' },
  submitted: { label: 'progress.submitted', icon: CircleCheck, className: 'text-success' },
  late: { label: 'progress.late', icon: Clock, className: 'text-warning' },
  missed: { label: 'progress.missed', icon: CircleAlert, className: 'text-danger' },
} as const satisfies Record<ProgressStatus, { label: string; icon: LucideIcon; className: string }>;

export function StatusLabel({ status }: { status: AssignmentStatus }) {
  const { t } = useTranslation('classes');
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span className={cn('flex items-center gap-1 font-medium', className)}>
      <Icon aria-hidden className="size-4 shrink-0" />
      {t(label)}
    </span>
  );
}

export const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;
