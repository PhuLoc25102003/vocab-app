import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSetInput, ReplaceCardsDto, UpdateSetDto } from '@vocab/shared';
import { createSet, getSet, replaceCards, updateSet } from '../api';
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

interface SaveSetInput extends ReplaceCardsDto {
  details: UpdateSetDto;
}

export function useSaveSet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // Lưu thông tin trước: nếu bước sau lỗi, gửi lại vẫn cho cùng kết quả.
    mutationFn: async ({ details, cards }: SaveSetInput) => {
      await updateSet(id, details);
      await replaceCards(id, { cards });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: setKeys.all }),
  });
}
