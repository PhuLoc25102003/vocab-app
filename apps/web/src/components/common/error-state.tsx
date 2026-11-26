'use client';

import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  /** Việc không làm được, ví dụ "Không tải được bộ từ". */
  title: string;
  /** Cách xử lý. */
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="glass-surface flex w-full flex-col items-start gap-3 rounded-2xl border border-border p-6 sm:p-8"
    >
      <h2 className="flex items-center gap-2 text-h2">
        <CircleAlert aria-hidden className="size-6 shrink-0 text-danger-mark" />
        {title}
      </h2>
      <p className="max-w-[65ch] text-text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}
