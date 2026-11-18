'use client';

import type { StudyMode } from '@vocab/shared';
import type { Route } from 'next';
import { accountStudyBackend } from '../api';
import { StudyShell } from './study-shell';

export function AccountStudy({ setId, mode }: { setId: string; mode: StudyMode }) {
  return (
    <StudyShell
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      exitHref={`/sets/${setId}` as Route}
    />
  );
}
