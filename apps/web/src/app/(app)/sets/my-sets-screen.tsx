'use client';

import { FolderFilter } from '@/features/folders/components/folder-filter';
import { MySets } from '@/features/sets/components/my-sets';

/** Feature không import lẫn nhau, nên ô lọc thư mục được ghép ở tầng trang. */
export function MySetsScreen() {
  return <MySets renderFolderFilter={(props) => <FolderFilter {...props} />} />;
}
