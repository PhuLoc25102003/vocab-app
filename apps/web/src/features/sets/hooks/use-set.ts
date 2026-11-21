import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSet, duplicateSet, getSet } from '../api';
import { setKeys } from '../query-keys';

export function useSet(id: string) {
  return useQuery({
    queryKey: setKeys.detail(id),
    queryFn: () => getSet(id),
  });
}

export function useDeleteSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteSet(id),
    onSuccess: () => {
      // Không tải lại chi tiết, vì bộ từ đã xoá sẽ trả 404 ngay trước khi rời trang.
      queryClient.removeQueries({ queryKey: setKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: setKeys.mineLists });
    },
  });
}

export function useDuplicateSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => duplicateSet(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: setKeys.mineLists }),
  });
}
