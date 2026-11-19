import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  /** `narrow` cho trang dạng form, căn giữa cả tiêu đề để thẳng hàng với nội dung. */
  width?: 'narrow' | 'wide';
  children: ReactNode;
}

/** Khung nội dung của một trang. Trang danh sách dùng `wide`, trang form dùng `narrow`. */
export function PageContainer({ width = 'wide', children }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto flex w-full flex-col gap-6', width === 'narrow' && 'max-w-[720px]')}
    >
      {children}
    </div>
  );
}
