import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Khối giữ chỗ tĩnh, vì giao diện không tạo chuyển động khi tải trang. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('rounded-md bg-border', className)} {...props} />;
}
