'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SetSummary } from '@vocab/shared';
import {
  Check,
  Copy,
  Download,
  FileUp,
  Folder,
  FolderInput,
  FolderMinus,
  GraduationCap,
  Link2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
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
  extraMenuItems?: ReactNode;
  extraDialogs?: ReactNode;
}

type OfflineState = 'missing' | 'saved' | 'outdated';

function useSetActionsLogic(set: SetSummary) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const { id, title } = set;
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

  return {
    t,
    id,
    title,
    deleteSet,
    duplicateSet,
    confirmingDelete,
    setConfirmingDelete,
    deleteError,
    setDeleteError,
    offlineState,
    offlineBusy,
    handleCopyLink,
    handleDuplicate,
    handleSaveOffline,
    handleRemoveOffline,
    confirmDelete,
  };
}

/** Menu chuột phải nổi trên thẻ bộ từ. */
export function SetContextMenuContent({
  set,
  folders,
  onMoveToFolder,
  movingFolder,
  extraMenuItems,
  extraDialogs,
}: SetContextMenuProps) {
  const {
    t,
    id,
    title,
    deleteSet,
    duplicateSet,
    confirmingDelete,
    setConfirmingDelete,
    deleteError,
    setDeleteError,
    offlineState,
    offlineBusy,
    handleCopyLink,
    handleDuplicate,
    handleSaveOffline,
    handleRemoveOffline,
    confirmDelete,
  } = useSetActionsLogic(set);

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
                value={set.folderId ?? ''}
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

        {extraMenuItems}
      </ContextMenuContent>

      {extraDialogs}

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

/** Nút ba chấm trên thẻ bộ từ, tối ưu cho mobile và thao tác chạm. */
export function SetCardActionsDropdown({
  set,
  folders,
  onMoveToFolder,
  movingFolder,
  extraMenuItems,
  extraDialogs,
}: SetContextMenuProps) {
  const {
    t,
    id,
    title,
    deleteSet,
    duplicateSet,
    confirmingDelete,
    setConfirmingDelete,
    deleteError,
    setDeleteError,
    offlineState,
    offlineBusy,
    handleCopyLink,
    handleDuplicate,
    handleSaveOffline,
    handleRemoveOffline,
    confirmDelete,
  } = useSetActionsLogic(set);
  const [movingFolderDialogOpen, setMovingFolderDialogOpen] = useState(false);

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('actions.more')}
            className="size-9 text-text-muted transition-colors duration-fast ease-standard hover:bg-surface hover:text-primary"
          >
            <MoreHorizontal aria-hidden className="size-5" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          {/* Bắt đầu học */}
          <MenuItem asChild>
            <Link href={`/sets/${id}` as Route}>
              <GraduationCap aria-hidden className="size-4" />
              <span>{t('actions.startStudy')}</span>
            </Link>
          </MenuItem>

          {/* Sửa bộ từ */}
          <MenuItem asChild>
            <Link href={`/sets/${id}/edit` as Route}>
              <Pencil aria-hidden className="size-4" />
              <span>{t('actions.edit')}</span>
            </Link>
          </MenuItem>

          {/* Chuyển vào thư mục: Dùng hộp thoại thay vì submenu ngang để tránh tràn màn hình mobile */}
          {onMoveToFolder && folders && folders.length > 0 ? (
            <MenuItem
              disabled={movingFolder}
              onSelect={() => {
                setTimeout(() => setMovingFolderDialogOpen(true), 0);
              }}
            >
              <FolderInput aria-hidden className="size-4" />
              <span>{t('folders.moveTo')}</span>
            </MenuItem>
          ) : null}

          {/* Nhập thêm thẻ */}
          <MenuItem asChild>
            <Link href={`/sets/import?setId=${id}` as Route}>
              <FileUp aria-hidden className="size-4" />
              <span>{t('actions.importMore')}</span>
            </Link>
          </MenuItem>

          <MenuSeparator />

          {/* Tải về máy / Lưu ngoại tuyến */}
          {offlineState === 'saved' ? (
            <MenuItem onSelect={handleRemoveOffline} disabled={offlineBusy}>
              <Trash2 aria-hidden className="size-4" />
              <span>{t('offline.saved')}</span>
            </MenuItem>
          ) : offlineState === 'outdated' ? (
            <MenuItem onSelect={handleSaveOffline} disabled={offlineBusy}>
              <RefreshCw aria-hidden className="size-4" />
              <span>{t('offline.outdated')}</span>
            </MenuItem>
          ) : (
            <MenuItem onSelect={handleSaveOffline} disabled={offlineBusy}>
              <Download aria-hidden className="size-4" />
              <span>{t('offline.missing')}</span>
            </MenuItem>
          )}

          {/* Sao chép liên kết */}
          <MenuItem onSelect={handleCopyLink}>
            <Link2 aria-hidden className="size-4" />
            <span>{t('actions.copyLink')}</span>
          </MenuItem>

          {/* Tạo bản sao */}
          <MenuItem onSelect={handleDuplicate} disabled={duplicateSet.isPending}>
            <Copy aria-hidden className="size-4" />
            <span>{t('actions.duplicate')}</span>
          </MenuItem>

          <MenuSeparator />

          {/* Xoá bộ từ */}
          <MenuItem
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
          </MenuItem>

          {extraMenuItems}
        </MenuContent>
      </Menu>

      {extraDialogs}

      {onMoveToFolder && folders && folders.length > 0 ? (
        <MoveToFolderDialog
          open={movingFolderDialogOpen}
          onOpenChange={setMovingFolderDialogOpen}
          setTitle={title}
          folders={folders}
          currentFolderId={set.folderId ?? null}
          movingFolder={movingFolder}
          onMoveToFolder={onMoveToFolder}
        />
      ) : null}

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

export interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setTitle: string;
  folders: SetFolderOption[];
  currentFolderId: string | null;
  movingFolder?: boolean;
  onMoveToFolder: (folderId: string | null) => void;
}

/** Hộp thoại chuyển thư mục dạng bottom sheet trên mobile, tránh tràn màn hình. */
export function MoveToFolderDialog({
  open,
  onOpenChange,
  setTitle,
  folders,
  currentFolderId,
  movingFolder,
  onMoveToFolder,
}: MoveToFolderDialogProps) {
  const { t } = useTranslation(['sets', 'common']);
  const titleId = useId();
  const descriptionId = useId();

  const handleSelect = (folderId: string | null) => {
    onMoveToFolder(folderId);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onRequestClose={() => {
        if (!movingFolder) onOpenChange(false);
      }}
      labelledBy={titleId}
      describedBy={descriptionId}
      layout="sheet"
      className="p-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
          >
            <FolderInput className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="text-h3 wrap-anywhere">
              {t('folders.moveTo')}
            </h2>
            <p id={descriptionId} className="truncate text-small text-text-muted">
              {setTitle}
            </p>
          </div>
        </div>

        <div className="max-h-60 divide-y divide-border overflow-y-auto rounded-md border border-border">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            disabled={movingFolder}
            className={cn(
              'flex w-full items-center justify-between px-3 py-2.5 text-left text-small transition-colors hover:bg-surface-elevated',
              currentFolderId === null && 'bg-primary-soft/40 font-medium text-primary',
            )}
          >
            <span className="flex items-center gap-2">
              <FolderMinus aria-hidden className="size-4 text-text-muted" />
              <span>{t('folders.none')}</span>
            </span>
            {currentFolderId === null ? (
              <Check aria-hidden className="size-4 shrink-0 text-primary" />
            ) : null}
          </button>
          {folders.map((f) => {
            const isSelected = currentFolderId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelect(f.id)}
                disabled={movingFolder}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2.5 text-left text-small transition-colors hover:bg-surface-elevated',
                  isSelected && 'bg-primary-soft/40 font-medium text-primary',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder aria-hidden className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{f.name}</span>
                </span>
                {isSelected ? <Check aria-hidden className="size-4 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={movingFolder}
          >
            {t('common:actions.close')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
