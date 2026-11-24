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
import { useTranslation } from 'react-i18next';

const SAVE_ERRORS = {
  unsupported: 'offline.unsupported',
  quota: 'offline.quota',
  failed: 'offline.failed',
} as const;

type OfflineState = 'missing' | 'saved' | 'outdated';

const ACTIONS = {
  missing: { label: 'offline.missing', Icon: Download },
  outdated: { label: 'offline.outdated', Icon: RefreshCw },
  saved: { label: 'offline.saved', Icon: Trash2 },
} as const;

/** Trạng thái bản tải về máy của bộ từ và hành động phù hợp: tải, cập nhật hoặc xoá. */
function useOfflineSet(set: SetDetail) {
  const { t } = useTranslation('sets');
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
      toast.success(t('offline.savedToast'));
    } catch (error) {
      toast.error(t(SAVE_ERRORS[error instanceof OfflineStorageError ? error.reason : 'failed']));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeOfflineSet(set.id);
      setSavedAt(null);
      toast.success(t('offline.removed'));
    } catch {
      toast.error(t('offline.removeFailed'));
    } finally {
      setBusy(false);
    }
  };

  return { ...ACTIONS[state], label: t(ACTIONS[state].label), state, busy, save, remove };
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
  const { t } = useTranslation('sets');
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('offline.removeTitle')}
      description={t('offline.removeDescription')}
      confirmLabel={t('offline.saved')}
      pending={offline.busy}
      onConfirm={() => void offline.remove().then(() => onOpenChange(false))}
    />
  );
}

/** Tải bộ từ về máy để xem khi mất mạng, hoặc xoá bản đã tải. */
export function OfflineToggle({ set }: { set: SetDetail }) {
  const { t } = useTranslation('sets');
  const offline = useOfflineSet(set);
  const [confirming, setConfirming] = useState(false);
  const { label, Icon, busy, state } = offline;
  return (
    <>
      <Button
        variant="secondary"
        loading={busy && !confirming}
        onClick={() => (state === 'saved' ? setConfirming(true) : void offline.save())}
        title={t('offline.tooltip')}
        className="w-full sm:w-auto justify-center gap-1.5 text-small whitespace-nowrap h-9 px-2.5 sm:px-3"
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span>{label}</span>
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
