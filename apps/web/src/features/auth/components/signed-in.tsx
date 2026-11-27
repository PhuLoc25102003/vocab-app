'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '../store';

/**
 * Chỉ hiện nội dung khi phiên đăng nhập đã sẵn sàng. Dùng cho phần nằm ngoài `AuthGate`
 * (header) để không gọi API trước khi có access token.
 */
export function SignedIn({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  return status === 'authenticated' ? children : null;
}
