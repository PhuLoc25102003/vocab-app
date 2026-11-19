'use client';

import { FolderFilter } from '@/features/folders/components/folder-filter';
import { FolderManager } from '@/features/folders/components/folder-manager';
import { MySets } from '@/features/sets/components/my-sets';

/** Feature không import lẫn nhau, nên ô lọc thư mục được ghép ở tầng trang. */
export function MySetsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <FolderManager />
      <MySets renderFolderFilter={(props) => <FolderFilter {...props} />} />
    </div>
  );
}
