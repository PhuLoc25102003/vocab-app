import {
  publicSetListSchema,
  setDetailResponseSchema,
  setListSchema,
  setResponseSchema,
  type CreateSetInput,
  type PublicSetList,
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
  q?: string;
  sort?: string;
  /** Id thư mục, hoặc `none` cho bộ chưa vào thư mục. */
  folderId?: string;
}

export interface PublicSetListParams extends SetListParams {
  q: string;
}

export async function listMySets({
  page,
  limit,
  q,
  sort,
  folderId,
}: SetListParams): Promise<SetList> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) {
    query.set('q', q);
  }
  if (sort) {
    query.set('sort', sort);
  }
  if (folderId) {
    query.set('folderId', folderId);
  }
  return setListSchema.parse(await http(`/sets?${query}`));
}

export async function listPublicSets({
  page,
  limit,
  q,
}: PublicSetListParams): Promise<PublicSetList> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) {
    query.set('q', q);
  }
  return publicSetListSchema.parse(await http(`/sets/public?${query}`, { skipAuth: true }));
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
