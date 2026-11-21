import {
  folderListSchema,
  folderResponseSchema,
  setResponseSchema,
  type Folder,
  type FolderList,
} from '@vocab/shared';
import { http } from '@/lib/http';

/** Một người dùng ít khi có nhiều thư mục, nên lấy một trang lớn nhất. */
export const FOLDER_PAGE_LIMIT = 100;

export async function listFolders(): Promise<FolderList> {
  return folderListSchema.parse(await http(`/folders?page=1&limit=${FOLDER_PAGE_LIMIT}`));
}

export async function createFolder(name: string): Promise<Folder> {
  const body = await http('/folders', { method: 'POST', body: JSON.stringify({ name }) });
  return folderResponseSchema.parse(body).data;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const body = await http(`/folders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return folderResponseSchema.parse(body).data;
}

export async function deleteFolder(id: string): Promise<void> {
  await http(`/folders/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** `null` đưa bộ từ ra khỏi thư mục. */
export async function moveSetToFolder(setId: string, folderId: string | null): Promise<void> {
  const body = await http(`/sets/${encodeURIComponent(setId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ folderId }),
  });
  setResponseSchema.parse(body);
}
