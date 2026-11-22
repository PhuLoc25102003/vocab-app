'use client';

import { useDraggable } from '@dnd-kit/core';
import type { SetSummary } from '@vocab/shared';
import { Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SetCardShell, type SetCardShellProps } from '@/components/common/set-card-shell';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { MenuItem } from '@/components/ui/menu';
import { FolderDndArea } from '@/features/folders/components/folder-dnd';
import { FolderHeader } from '@/features/folders/components/folder-header';
import { FolderPanel } from '@/features/folders/components/folder-panel';
import { useFolders, useMoveSet } from '@/features/folders/hooks';
import { MySets } from '@/features/sets/components/my-sets';
import {
  SetCardActionsDropdown,
  SetContextMenuContent,
} from '@/features/sets/components/set-context-menu';
import { useToggleVisibility } from '@/features/sets/components/toggle-visibility-button';
import { formErrorMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';

interface ContextMenuWrapperProps {
  set: SetSummary;
  folders: Array<{ id: string; name: string }>;
}

function SetCardContextMenuWrapper({ set, folders }: ContextMenuWrapperProps) {
  const { t } = useTranslation('sets');
  const move = useMoveSet(set.id);
  const toggleVisibility = useToggleVisibility(set);
  const isGoingPrivate = toggleVisibility.nextVisibility === 'PRIVATE';

  const handleMove = (folderId: string | null) => {
    move.mutateAsync(folderId).then(
      () => toast.success(t(folderId ? 'folders.movedShort' : 'folders.unfiled')),
      (error: unknown) => toast.error(formErrorMessage(error)),
    );
  };

  return (
    <SetContextMenuContent
      set={set}
      folders={folders}
      onMoveToFolder={handleMove}
      movingFolder={move.isPending}
      extraMenuItems={
        <ContextMenuItem onSelect={toggleVisibility.toggle} disabled={toggleVisibility.isPending}>
          {isGoingPrivate ? (
            <Lock aria-hidden className="size-4" />
          ) : (
            <Globe aria-hidden className="size-4" />
          )}
          <span>{t(isGoingPrivate ? 'actions.makePrivate' : 'actions.makePublic')}</span>
        </ContextMenuItem>
      }
    />
  );
}

function SetCardActionsDropdownWrapper({ set, folders }: ContextMenuWrapperProps) {
  const { t } = useTranslation('sets');
  const move = useMoveSet(set.id);
  const toggleVisibility = useToggleVisibility(set);
  const isGoingPrivate = toggleVisibility.nextVisibility === 'PRIVATE';

  const handleMove = (folderId: string | null) => {
    move.mutateAsync(folderId).then(
      () => toast.success(t(folderId ? 'folders.movedShort' : 'folders.unfiled')),
      (error: unknown) => toast.error(formErrorMessage(error)),
    );
  };

  return (
    <SetCardActionsDropdown
      set={set}
      folders={folders}
      onMoveToFolder={handleMove}
      movingFolder={move.isPending}
      extraMenuItems={
        <MenuItem onSelect={toggleVisibility.toggle} disabled={toggleVisibility.isPending}>
          {isGoingPrivate ? (
            <Lock aria-hidden className="size-4" />
          ) : (
            <Globe aria-hidden className="size-4" />
          )}
          <span>{t(isGoingPrivate ? 'actions.makePrivate' : 'actions.makePublic')}</span>
        </MenuItem>
      }
    />
  );
}

function DraggableMySetCard({ set, ...props }: { set: SetSummary } & SetCardShellProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: set.id,
    data: { title: set.title, folderId: set.folderId ?? null },
  });

  return (
    <SetCardShell
      ref={setNodeRef}
      {...props}
      {...listeners}
      {...attributes}
      className={cn('cursor-grab active:cursor-grabbing', isDragging && 'opacity-40 shadow-raised')}
    />
  );
}

/** Feature không import lẫn nhau, nên cột thư mục và menu thư mục trên thẻ được ghép ở tầng trang. */
export function MySetsScreen() {
  const foldersQuery = useFolders();
  const foldersList = foldersQuery.data?.data ?? [];

  return (
    <FolderDndArea>
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <FolderPanel />
        <div className="flex min-w-0 flex-col gap-4">
          <FolderHeader />
          <MySets
            renderCardActions={(set) => (
              <SetCardActionsDropdownWrapper set={set} folders={foldersList} />
            )}
            renderContextMenu={(set) => (
              <SetCardContextMenuWrapper set={set} folders={foldersList} />
            )}
            renderCard={(set, props) => <DraggableMySetCard key={set.id} set={set} {...props} />}
          />
        </div>
      </div>
    </FolderDndArea>
  );
}
