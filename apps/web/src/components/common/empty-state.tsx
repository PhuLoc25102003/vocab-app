import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Hành động chính để người dùng bắt đầu. */
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex max-w-[65ch] flex-col items-start gap-3 py-12">
      <h2 className="text-h2">{title}</h2>
      {description ? <p className="text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
