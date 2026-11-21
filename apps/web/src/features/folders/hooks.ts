import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFolder, deleteFolder, listFolders, moveSetToFolder, renameFolder } from './api';

export const folderKeys = { all: ['folders'] as const };
// Danh sách bộ từ dùng khoá bắt đầu bằng 'sets'.
const SETS_KEY = ['sets'] as const;

export function useFolders() {
  return useQuery({ queryKey: folderKeys.all, queryFn: listFolders });
}

/** Mọi thay đổi thư mục đều làm đổi số bộ và danh sách bộ từ. */
function useFolderMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: folderKeys.all }),
        queryClient.invalidateQueries({ queryKey: SETS_KEY }),
      ]),
  });
}

export const useCreateFolder = () => useFolderMutation((name: string) => createFolder(name));
export const useRenameFolder = () =>
  useFolderMutation(({ id, name }: { id: string; name: string }) => renameFolder(id, name));
export const useDeleteFolder = () => useFolderMutation((id: string) => deleteFolder(id));
/** Chuyển bộ bất kỳ, dùng khi kéo thả trên danh sách. */
export const useMoveAnySet = () =>
  useFolderMutation(({ setId, folderId }: { setId: string; folderId: string | null }) =>
    moveSetToFolder(setId, folderId),
  );
export const useMoveSet = (setId: string) =>
  useFolderMutation((folderId: string | null) => moveSetToFolder(setId, folderId));
