'use client';

import { ErrorState } from '@/components/common/error-state';

export default function AppError({ retry }: { retry: () => void }) {
  return (
    <ErrorState
      title="Không tải được trang này"
      description="Kiểm tra kết nối mạng rồi thử lại."
      onRetry={retry}
    />
  );
}
