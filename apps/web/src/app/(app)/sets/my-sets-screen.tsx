'use client';

import { FolderDndArea, SetDragHandle } from '@/features/folders/components/folder-dnd';
import { FolderHeader } from '@/features/folders/components/folder-header';
import { FolderPanel } from '@/features/folders/components/folder-panel';
import { SetFolderPicker } from '@/features/folders/components/set-folder-picker';
import { MySets } from '@/features/sets/components/my-sets';

/** Feature không import lẫn nhau, nên cột thư mục và menu thư mục trên thẻ được ghép ở tầng trang. */
export function MySetsScreen() {
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
          />
        </div>
      </div>
    </FolderDndArea>
  );
}
