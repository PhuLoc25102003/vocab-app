import type { StudyMode } from '@vocab/shared';

export const studyKeys = {
  dueLists: ['study', 'due'] as const,
  due: (page: number) => ['study', 'due', page] as const,
  session: (setId: string, mode: StudyMode, dueOnly: boolean) =>
    ['study', 'session', setId, mode, dueOnly] as const,
};
