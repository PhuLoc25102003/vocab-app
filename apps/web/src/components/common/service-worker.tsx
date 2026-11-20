'use client';

import { useEffect } from 'react';

/** Đăng ký service worker ở bản production. Bản dev không dùng để tránh lưu nhầm mã cũ. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);
  return null;
}
