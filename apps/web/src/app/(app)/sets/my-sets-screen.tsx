'use client';

import type { SetSummary } from '@vocab/shared';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FolderDndArea, SetDragHandle } from '@/features/folders/components/folder-dnd';
import { FolderHeader } from '@/features/folders/components/folder-header';
import { FolderPanel } from '@/features/folders/components/folder-panel';
import { SetFolderPicker } from '@/features/folders/components/set-folder-picker';
import { useFolders, useMoveSet } from '@/features/folders/hooks';
import { MySets } from '@/features/sets/components/my-sets';
import { SetContextMenuContent } from '@/features/sets/components/set-context-menu';
import { formErrorMessage } from '@/lib/form-errors';

function SetCardContextMenuWrapper({
  set,
  folders,
}: {
  set: SetSummary;
  folders: Array<{ id: string; name: string }>;
}) {
  const { t } = useTranslation('sets');
  const move = useMoveSet(set.id);

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
              <>
                <SetDragHandle setId={set.id} title={set.title} folderId={set.folderId ?? null} />
                <SetFolderPicker
                  variant="icon"
                  setId={set.id}
                  setTitle={set.title}
                  folderId={set.folderId ?? null}
                />
              </>
            )}
            renderContextMenu={(set) => (
              <SetCardContextMenuWrapper set={set} folders={foldersList} />
            )}
          />
        </div>
      </div>
    </FolderDndArea>
  );
}
