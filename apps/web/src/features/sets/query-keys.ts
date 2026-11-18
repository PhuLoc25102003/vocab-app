import type { SetListParams } from './api';

export const setKeys = {
  all: ['sets'] as const,
  mine: (params: SetListParams) => ['sets', 'mine', params] as const,
  editor: (id: string) => ['sets', 'editor', id] as const,
};
