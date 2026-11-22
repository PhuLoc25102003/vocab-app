'use client';

import type { StudyMode } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { createGuestBackend } from '../guest-backend';
import { StudyShell } from './study-shell';
import { useTranslation } from 'react-i18next';

export function GuestStudy({ setId, mode }: { setId: string; mode: StudyMode }) {
  const { t } = useTranslation('study');
  const [backend] = useState(createGuestBackend);
  const studyPath = `/sets/${setId}/study/${mode.toLowerCase()}`;

  return (
    <StudyShell
      backend={backend}
      setId={setId}
      mode={mode}
      exitHref={`/public/sets/${setId}` as Route}
      exitLabel={t('result.return')}
      resultNote={
        <p className="text-small text-text-muted">
          {t('guest.note')}{' '}
          <Link
            href={`/login?next=${encodeURIComponent(studyPath)}` as Route}
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            {t('guest.login')}
          </Link>
        </p>
      }
    />
  );
}
