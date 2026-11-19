import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Nút hành động của trang, tối đa một nút primary. */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-[65ch] min-w-0 flex-col gap-1">
        <h1 className="text-h1 wrap-anywhere">{title}</h1>
        {description ? <p className="wrap-anywhere text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
