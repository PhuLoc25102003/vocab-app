'use client';

import type { StudyMode } from '@vocab/shared';
import type { Route } from 'next';
import { accountStudyBackend } from '../api';
import { StudyShell } from './study-shell';

interface AccountStudyProps {
  setId: string;
  mode: StudyMode;
  dueOnly: boolean;
}

export function AccountStudy({ setId, mode, dueOnly }: AccountStudyProps) {
  return (
    <StudyShell
      backend={accountStudyBackend}
      setId={setId}
      mode={mode}
      dueOnly={dueOnly}
      exitHref={(dueOnly ? '/review' : `/sets/${setId}`) as Route}
    />
  );
}
