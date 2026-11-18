import { setListSchema, type SetList } from '@vocab/shared';
import { http } from '@/lib/http';

export interface SetListParams {
  page: number;
  limit: number;
}

export async function listMySets({ page, limit }: SetListParams): Promise<SetList> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return setListSchema.parse(await http(`/sets?${query}`));
}
