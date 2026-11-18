'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { refreshSession } from '../session';
import { useAuthStore } from '../store';

/** Khôi phục phiên khi mở trang và chỉ hiện nội dung cho người đã đăng nhập. */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    if (status === 'loading') {
      void refreshSession();
    } else if (status === 'signed-out') {
      router.replace('/login');
    } else if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}` as Route);
    }
  }, [pathname, router, status]);

  if (status === 'authenticated') {
    return children;
  }
  if (status === 'unavailable') {
    return (
      <ErrorState
        title="Không kết nối được máy chủ"
        description="Hãy kiểm tra mạng rồi thử lại."
        onRetry={() => setStatus('loading')}
      />
    );
  }
  return <AuthGateLoading />;
}

export function AuthGateLoading() {
  return (
    <LoadingState label="Đang kiểm tra phiên đăng nhập">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
    </LoadingState>
  );
}
