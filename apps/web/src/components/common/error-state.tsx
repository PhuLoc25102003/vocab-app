import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** Việc không làm được, ví dụ "Không tải được bộ từ". */
  title: string;
  /** Cách xử lý. */
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex max-w-[65ch] flex-col items-start gap-3 py-12">
      <h2 className="flex items-center gap-2 text-h2">
        <CircleAlert aria-hidden className="size-6 shrink-0 text-danger-mark" />
        {title}
      </h2>
      <p className="text-text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
