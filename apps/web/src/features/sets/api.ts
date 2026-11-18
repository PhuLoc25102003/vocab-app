import {
  setDetailResponseSchema,
  setListSchema,
  setResponseSchema,
  type CreateSetInput,
  type ReplaceCardsDto,
  type SetDetail,
  type SetList,
  type SetSummary,
  type UpdateSetDto,
} from '@vocab/shared';
import { http, type HttpOptions } from '@/lib/http';

export interface SetListParams {
  page: number;
  limit: number;
}

export async function listMySets({ page, limit }: SetListParams): Promise<SetList> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return setListSchema.parse(await http(`/sets?${query}`));
}

export async function getSet(id: string, options?: HttpOptions): Promise<SetDetail> {
  const body = await http(`/sets/${encodeURIComponent(id)}`, options);
  return setDetailResponseSchema.parse(body).data;
}

export async function createSet(input: CreateSetInput): Promise<SetSummary> {
  const body = await http('/sets', { method: 'POST', body: JSON.stringify(input) });
  return setResponseSchema.parse(body).data;
}

export async function updateSet(id: string, input: UpdateSetDto): Promise<SetSummary> {
  const body = await http(`/sets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return setResponseSchema.parse(body).data;
}

export async function deleteSet(id: string): Promise<void> {
  await http(`/sets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function duplicateSet(id: string): Promise<SetSummary> {
  const body = await http(`/sets/${encodeURIComponent(id)}/duplicate`, { method: 'POST' });
  return setResponseSchema.parse(body).data;
}

export async function replaceCards(id: string, input: ReplaceCardsDto): Promise<void> {
  await http(`/sets/${encodeURIComponent(id)}/cards`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
