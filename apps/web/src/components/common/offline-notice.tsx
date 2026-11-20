'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Trang service worker trả về khi mất mạng. */
export function OfflineNotice() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-start justify-center gap-4 px-4 py-16">
      <WifiOff aria-hidden className="size-10 text-primary" />
      <h1 className="text-h1">Bạn đang offline</h1>
      <p className="text-text-muted">
        Không kết nối được mạng nên chưa mở được trang này. Hãy kiểm tra Wi-Fi hoặc dữ liệu di động
        rồi thử lại.
      </p>
      <Button onClick={() => window.location.reload()}>Thử lại</Button>
    </main>
  );
}
