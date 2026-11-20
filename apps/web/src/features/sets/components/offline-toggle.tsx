'use client';

import type { SetDetail } from '@vocab/shared';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/components/ui/menu';
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

type OfflineState = 'missing' | 'saved' | 'outdated';

const ACTIONS = {
  missing: { label: 'Tải về máy', Icon: Download },
  outdated: { label: 'Cập nhật bản offline', Icon: RefreshCw },
  saved: { label: 'Xoá bản offline', Icon: Trash2 },
} as const;

/** Trạng thái bản tải về máy của bộ từ và hành động phù hợp: tải, cập nhật hoặc xoá. */
function useOfflineSet(set: SetDetail) {
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

  const state: OfflineState =
    savedAt === null ? 'missing' : savedUpdatedAt === String(set.updatedAt) ? 'saved' : 'outdated';

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

  const run = () => void (state === 'saved' ? remove() : save());
  return { ...ACTIONS[state], busy, run };
}

/** Tải bộ từ về máy để xem khi mất mạng, hoặc xoá bản đã tải. */
export function OfflineToggle({ set }: { set: SetDetail }) {
  const { label, Icon, busy, run } = useOfflineSet(set);
  return (
    <Button variant="secondary" loading={busy} onClick={run}>
      <Icon aria-hidden className="size-4" />
      {label}
    </Button>
  );
}

/** Cùng hành động như `OfflineToggle`, đặt trong menu thao tác của bộ từ. */
export function OfflineMenuItem({ set }: { set: SetDetail }) {
  const { label, Icon, busy, run } = useOfflineSet(set);
  return (
    <MenuItem disabled={busy} onSelect={run}>
      <Icon aria-hidden className="size-4" />
      {label}
    </MenuItem>
  );
}
