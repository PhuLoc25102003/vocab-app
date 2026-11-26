'use client';

import { LayoutGroup, m } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Lò xo "giọt nước": trượt nhanh, nảy nhẹ khi dừng. */
export const LIQUID_SPRING = { type: 'spring', bounce: 0.28, duration: 0.5 } as const;

/**
 * Bọc một nhóm tab. Mỗi nhóm có `LayoutGroup` riêng để bong bóng không bay sang nhóm khác trên
 * cùng trang (ví dụ thanh điều hướng render hai lần cho máy tính và điện thoại).
 */
export function GlassTabGroup({ children }: { children: ReactNode }) {
  const id = useId();
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

/**
 * Bong bóng kính dưới tab đang chọn, chỉ render ở tab đó. Khi đổi tab, Motion trượt và co giãn
 * bong bóng từ vị trí cũ sang mới bằng transform, không render lại React ở từng khung hình.
 * Tab chứa nó cần `relative isolate` để bong bóng nằm dưới chữ.
 */
export function GlassTabIndicator({
  tone = 'clear',
  radius = 9999,
  className,
}: {
  /** `clear`: kính trong, chữ tab dùng `text-primary`. `tint`: kính nhuộm, chữ `primary-fg`. */
  tone?: 'clear' | 'tint';
  /** Bo góc theo px, khớp bo góc của tab. Mặc định dạng viên thuốc. */
  radius?: number;
  className?: string;
}) {
  return (
    <m.span
      layoutId="glass-tab-indicator"
      aria-hidden
      transition={LIQUID_SPRING}
      // Motion bù méo bo góc khi co giãn nếu bo góc khai báo trong style.
      style={{ borderRadius: radius }}
      className={cn(
        'pointer-events-none absolute inset-0 -z-10',
        tone === 'tint' ? 'glass-button-tint' : 'glass-button',
        className,
      )}
    />
  );
}
