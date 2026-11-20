import type { PublicSetListParams, SetListParams } from './api';

export const setKeys = {
  all: ['sets'] as const,
  mineLists: ['sets', 'mine'] as const,
  mine: (params: SetListParams) => ['sets', 'mine', params] as const,
  publicList: (params: PublicSetListParams) => ['sets', 'public', params] as const,
  detail: (id: string) => ['sets', 'detail', id] as const,
  editor: (id: string) => ['sets', 'editor', id] as const,
  uploadConfig: ['uploads', 'config'] as const,
};
