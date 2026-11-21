import type { StudyMode } from '@vocab/shared';

export const studyKeys = {
  assignment: (assignmentId: string) => ['study', 'assignment', assignmentId] as const,
  dueLists: ['study', 'due'] as const,
  due: (page: number) => ['study', 'due', page] as const,
  session: (setId: string, mode: StudyMode, dueOnly: boolean, assignmentId?: string) =>
    ['study', 'session', setId, mode, dueOnly, assignmentId ?? null] as const,
};
