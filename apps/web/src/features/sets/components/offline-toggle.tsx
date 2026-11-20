'use client';

import type { SetDetail } from '@vocab/shared';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
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

  return { ...ACTIONS[state], state, busy, save, remove };
}

type OfflineSetControls = ReturnType<typeof useOfflineSet>;

/** Hỏi lại trước khi xoá bản đã tải, vì xoá rồi thì mất mạng sẽ không xem được. */
function RemoveOfflineDialog({
  offline,
  open,
  onOpenChange,
}: {
  offline: OfflineSetControls;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xoá bản offline?"
      description="Bộ từ vẫn còn trên tài khoản, chỉ không xem được khi mất mạng cho tới khi bạn tải lại."
      confirmLabel="Xoá bản offline"
      pending={offline.busy}
      onConfirm={() => void offline.remove().then(() => onOpenChange(false))}
    />
  );
}

/** Tải bộ từ về máy để xem khi mất mạng, hoặc xoá bản đã tải. */
export function OfflineToggle({ set }: { set: SetDetail }) {
  const offline = useOfflineSet(set);
  const [confirming, setConfirming] = useState(false);
  const { label, Icon, busy, state } = offline;
  return (
    <>
      <Button
        variant="secondary"
        loading={busy && !confirming}
        onClick={() => (state === 'saved' ? setConfirming(true) : void offline.save())}
      >
        <Icon aria-hidden className="size-4" />
        {label}
      </Button>
      <RemoveOfflineDialog offline={offline} open={confirming} onOpenChange={setConfirming} />
    </>
  );
}

/**
 * Cùng hành động như `OfflineToggle` cho menu thao tác. Hộp thoại nằm ngoài menu vì menu đóng
 * lại khi chọn mục, nên gọi hook ở cấp chứa menu rồi truyền vào đây.
 */
export function useOfflineMenu(set: SetDetail) {
  const offline = useOfflineSet(set);
  const [confirming, setConfirming] = useState(false);
  const { label, Icon, busy, state } = offline;

  const item = (
    <MenuItem
      disabled={busy}
      onSelect={() =>
        state === 'saved' ? setTimeout(() => setConfirming(true)) : void offline.save()
      }
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </MenuItem>
  );
  const dialog = (
    <RemoveOfflineDialog offline={offline} open={confirming} onOpenChange={setConfirming} />
  );
  return { item, dialog };
}
