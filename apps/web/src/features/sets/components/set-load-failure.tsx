import { ERROR_CODES } from '@vocab/shared';
import Link from 'next/link';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { HttpError } from '@/lib/http';

interface SetLoadFailureProps {
  error: unknown;
  onRetry: () => void;
}

export function SetLoadFailure({ error, onRetry }: SetLoadFailureProps) {
  if (error instanceof HttpError && error.code === ERROR_CODES.SET_NOT_FOUND) {
    return (
      <EmptyState
        title="Không tìm thấy bộ từ"
        description="Bộ từ này đã bị xoá hoặc bạn không có quyền xem."
        action={
          <Button asChild variant="secondary">
            <Link href="/sets">Về danh sách bộ từ</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ErrorState
      title="Không tải được bộ từ"
      description="Hãy kiểm tra mạng rồi thử lại."
      onRetry={onRetry}
    />
  );
}
