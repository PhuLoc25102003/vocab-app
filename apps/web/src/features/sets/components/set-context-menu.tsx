'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SetSummary } from '@vocab/shared';
import {
  Copy,
  Download,
  FileUp,
  Folder,
  FolderInput,
  FolderMinus,
  GraduationCap,
  Link2,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { formErrorMessage } from '@/lib/form-errors';
import {
  getOfflineSet,
  OfflineStorageError,
  removeOfflineSet,
  saveOfflineSet,
} from '@/lib/offline-store';
import { getSet } from '../api';
import { useDeleteSet, useDuplicateSet } from '../hooks/use-set';
import { useTranslation } from 'react-i18next';

export interface SetFolderOption {
  id: string;
  name: string;
}

export interface SetContextMenuProps {
  set: SetSummary;
  folders?: SetFolderOption[];
  onMoveToFolder?: (folderId: string | null) => void;
  movingFolder?: boolean;
}

type OfflineState = 'missing' | 'saved' | 'outdated';

export function SetContextMenuContent({
  set,
  folders,
  onMoveToFolder,
  movingFolder,
}: SetContextMenuProps) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const { id, title, folderId } = set;
  const deleteSet = useDeleteSet(id);
  const duplicateSet = useDuplicateSet(id);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [offlineState, setOfflineState] = useState<OfflineState>('missing');
  const [offlineBusy, setOfflineBusy] = useState(false);

  useEffect(() => {
    getOfflineSet(id)
      .then((entry) => {
        if (!entry) {
          setOfflineState('missing');
        } else {
          setOfflineState(
            String(entry.set.updatedAt) === String(set.updatedAt) ? 'saved' : 'outdated',
          );
        }
      })
      .catch(() => setOfflineState('missing'));
  }, [id, set.updatedAt]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/sets/${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(t('actions.linkCopied')))
      .catch(() => undefined);
  };

  const handleDuplicate = () => {
    duplicateSet.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success(t('actions.copied'));
        router.push(`/sets/${copy.id}` as Route);
      },
      onError: (err) => toast.error(formErrorMessage(err)),
    });
  };

  const handleSaveOffline = async () => {
    setOfflineBusy(true);
    const toastId = toast.loading(t('actions.downloading'));
    try {
      const detail = await getSet(id);
      await saveOfflineSet(detail);
      setOfflineState('saved');
      toast.success(t('offline.savedToast'), { id: toastId });
    } catch (error) {
      const reason = error instanceof OfflineStorageError ? error.reason : 'failed';
      const msgKey =
        reason === 'quota'
          ? 'offline.quota'
          : reason === 'unsupported'
            ? 'offline.unsupported'
            : 'offline.failed';
      toast.error(t(msgKey), { id: toastId });
    } finally {
      setOfflineBusy(false);
    }
  };

  const handleRemoveOffline = async () => {
    setOfflineBusy(true);
    try {
      await removeOfflineSet(id);
      setOfflineState('missing');
      toast.success(t('offline.removed'));
    } catch {
      toast.error(t('offline.removeFailed'));
    } finally {
      setOfflineBusy(false);
    }
  };

  const confirmDelete = () => {
    setDeleteError(null);
    deleteSet.mutate(undefined, {
      onSuccess: () => {
        setConfirmingDelete(false);
        toast.success(t('actions.deleted'));
      },
      onError: (reason) => setDeleteError(formErrorMessage(reason)),
    });
  };

  return (
    <>
      <ContextMenuContent>
        {/* Bắt đầu học */}
        <ContextMenuItem asChild>
          <Link href={`/sets/${id}` as Route}>
            <GraduationCap aria-hidden className="size-4" />
            <span>{t('actions.startStudy')}</span>
          </Link>
        </ContextMenuItem>

        {/* Sửa bộ từ */}
        <ContextMenuItem asChild>
          <Link href={`/sets/${id}/edit` as Route}>
            <Pencil aria-hidden className="size-4" />
            <span>{t('actions.edit')}</span>
          </Link>
        </ContextMenuItem>

        {/* Chuyển vào thư mục */}
        {onMoveToFolder && folders && folders.length > 0 ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={movingFolder}>
              <FolderInput aria-hidden className="size-4" />
              <span>{t('folders.moveTo')}</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-w-72">
              <ContextMenuLabel>{t('folders.choose')}</ContextMenuLabel>
              <ContextMenuRadioGroup
                value={folderId ?? ''}
                onValueChange={(val) => onMoveToFolder(val === '' ? null : val)}
              >
                <ContextMenuRadioItem value="">
                  <span className="flex items-center gap-2">
                    <FolderMinus aria-hidden className="size-4 text-text-muted" />
                    <span>{t('folders.none')}</span>
                  </span>
                </ContextMenuRadioItem>
                {folders.map((f) => (
                  <ContextMenuRadioItem key={f.id} value={f.id}>
                    <span className="flex items-center gap-2">
                      <Folder aria-hidden className="size-4 text-primary" />
                      <span className="truncate">{f.name}</span>
                    </span>
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : null}

        {/* Nhập thêm thẻ */}
        <ContextMenuItem asChild>
          <Link href={`/sets/import?setId=${id}` as Route}>
            <FileUp aria-hidden className="size-4" />
            <span>{t('actions.importMore')}</span>
          </Link>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Tải về máy / Lưu ngoại tuyến */}
        {offlineState === 'saved' ? (
          <ContextMenuItem onSelect={handleRemoveOffline} disabled={offlineBusy}>
            <Trash2 aria-hidden className="size-4" />
            <span>{t('offline.saved')}</span>
          </ContextMenuItem>
        ) : offlineState === 'outdated' ? (
          <ContextMenuItem onSelect={handleSaveOffline} disabled={offlineBusy}>
            <RefreshCw aria-hidden className="size-4" />
            <span>{t('offline.outdated')}</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={handleSaveOffline} disabled={offlineBusy}>
            <Download aria-hidden className="size-4" />
            <span>{t('offline.missing')}</span>
          </ContextMenuItem>
        )}

        {/* Sao chép liên kết */}
        <ContextMenuItem onSelect={handleCopyLink}>
          <Link2 aria-hidden className="size-4" />
          <span>{t('actions.copyLink')}</span>
        </ContextMenuItem>

        {/* Tạo bản sao */}
        <ContextMenuItem onSelect={handleDuplicate} disabled={duplicateSet.isPending}>
          <Copy aria-hidden className="size-4" />
          <span>{t('actions.duplicate')}</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Xoá bộ từ */}
        <ContextMenuItem
          danger
          onSelect={() => {
            setTimeout(() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            });
          }}
        >
          <Trash2 aria-hidden className="size-4" />
          <span>{t('actions.delete')}</span>
        </ContextMenuItem>
      </ContextMenuContent>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t('actions.deleteTitle', { title })}
        description={t('actions.deleteDescription')}
        confirmLabel={t('actions.delete')}
        pending={deleteSet.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
}
