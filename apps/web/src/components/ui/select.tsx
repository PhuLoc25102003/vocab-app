import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Giữ thẻ `select` gốc để form, bàn phím, trình đọc màn hình và bộ chọn trên điện thoại
 * vẫn đúng. Bỏ giao diện mặc định, vẽ mũi tên riêng; trình duyệt hỗ trợ `base-select`
 * thì danh sách lựa chọn cũng theo token (lớp `select-styled` trong `globals.css`).
 */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          'select-styled h-11 min-h-11 w-full cursor-pointer appearance-none truncate rounded-lg border border-border-strong bg-surface py-2 pr-10 pl-3.5 text-small transition-colors duration-fast ease-standard hover:border-text-muted focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-bg aria-invalid:border-danger-mark sm:text-body',
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
