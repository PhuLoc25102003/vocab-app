import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSetInput, UpdateSetDto } from '@vocab/shared';
import { createSet, getSet, updateSet } from '../api';
import { setKeys } from '../query-keys';

/** Form chỉ nhận dữ liệu một lần, nên luôn tải bản mới thay vì dùng cache. */
export function useEditableSet(id: string) {
  return useQuery({
    queryKey: setKeys.editor(id),
    queryFn: () => getSet(id),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSetInput) => createSet(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: setKeys.all }),
  });
}

export function useUpdateSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSetDto) => updateSet(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: setKeys.all }),
  });
}
