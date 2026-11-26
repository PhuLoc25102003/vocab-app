import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Hành động chính để người dùng bắt đầu. */
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-surface flex w-full flex-col items-start gap-3 rounded-2xl border border-border p-6 sm:p-8">
      <h2 className="text-h2">{title}</h2>
      {description ? <p className="max-w-[65ch] text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
