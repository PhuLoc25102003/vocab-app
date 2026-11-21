'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { accountStudyBackend } from '../api';
import { syncPendingSessions } from '../offline-sync';
import { useTranslation } from 'react-i18next';

/** Chạy khi vào app đã đăng nhập và mỗi khi có mạng lại. Không hiện gì nếu không có phiên chờ. */
export function OfflineSync() {
  const { t } = useTranslation('study');
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (running.current || !navigator.onLine) return;
      running.current = true;
      try {
        const { synced } = await syncPendingSessions(accountStudyBackend);
        if (synced > 0) {
          toast.success(t('offline.synced', { count: synced }));
          await queryClient.invalidateQueries();
        }
      } catch {
        // Không đọc được hàng đợi trên máy: thử lại ở lần có mạng sau.
      } finally {
        running.current = false;
      }
    };
    void run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [queryClient, t]);

  return null;
}
