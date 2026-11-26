'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

const loadFeatures = () => import('@/lib/motion-features').then((mod) => mod.default);

/**
 * Motion cho toàn app (ADR 0004): `LazyMotion` tải gói tính năng sau lần vẽ đầu nên trang không
 * nặng thêm, `strict` bắt dùng `m.*` thay `motion.*` để không lỡ kéo cả thư viện vào. Hoạt ảnh
 * chạy ngoài chu trình render của React; `reducedMotion="user"` tắt chuyển động khi người dùng
 * bật giảm chuyển động.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
