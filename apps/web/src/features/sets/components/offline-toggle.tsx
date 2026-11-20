'use client';

import type { SetDetail } from '@vocab/shared';
import { Download, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getOfflineSet,
  OfflineStorageError,
  removeOfflineSet,
  saveOfflineSet,
} from '@/lib/offline-store';

const SAVE_ERRORS = {
  unsupported: 'Trình duyệt này không lưu được bộ từ để dùng offline.',
  quota: 'Máy đã hết dung lượng. Hãy xoá bớt bộ đã tải rồi thử lại.',
  failed: 'Không tải được bộ từ về máy. Hãy thử lại.',
} as const;

/** Tải bộ từ về máy để xem khi mất mạng, hoặc xoá bản đã tải. */
export function OfflineToggle({ set }: { set: SetDetail }) {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedUpdatedAt, setSavedUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOfflineSet(set.id)
      .then((entry) => {
        setSavedAt(entry?.savedAt ?? null);
        setSavedUpdatedAt(entry ? String(entry.set.updatedAt) : null);
      })
      .catch(() => undefined);
  }, [set.id]);

  const outdated = savedAt !== null && savedUpdatedAt !== String(set.updatedAt);

  const save = async () => {
    setBusy(true);
    try {
      await saveOfflineSet(set);
      setSavedAt(new Date().toISOString());
      setSavedUpdatedAt(String(set.updatedAt));
      toast.success('Đã tải về máy, xem được cả khi mất mạng');
    } catch (error) {
      toast.error(SAVE_ERRORS[error instanceof OfflineStorageError ? error.reason : 'failed']);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeOfflineSet(set.id);
      setSavedAt(null);
      toast.success('Đã xoá bản offline');
    } catch {
      toast.error('Không xoá được bản offline. Hãy thử lại.');
    } finally {
      setBusy(false);
    }
  };

  if (savedAt && !outdated) {
    return (
      <Button variant="secondary" loading={busy} onClick={() => void remove()}>
        <Trash2 aria-hidden className="size-4" />
        Xoá bản offline
      </Button>
    );
  }
  return (
    <Button variant="secondary" loading={busy} onClick={() => void save()}>
      <Download aria-hidden className="size-4" />
      {outdated ? 'Cập nhật bản offline' : 'Tải về máy'}
    </Button>
  );
}
