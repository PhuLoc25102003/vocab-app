'use client';

import type { StudyMode } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { createGuestBackend } from '../guest-backend';
import { StudyShell } from './study-shell';

export function GuestStudy({ setId, mode }: { setId: string; mode: StudyMode }) {
  const [backend] = useState(createGuestBackend);
  const studyPath = `/sets/${setId}/study/${mode.toLowerCase()}`;

  return (
    <StudyShell
      backend={backend}
      setId={setId}
      mode={mode}
      exitHref={`/public/sets/${setId}` as Route}
      resultNote={
        <p className="text-small text-text-muted">
          Đây là phiên học thử nên tiến độ chưa được lưu.{' '}
          <Link
            href={`/login?next=${encodeURIComponent(studyPath)}` as Route}
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            Đăng nhập để lưu tiến độ
          </Link>
        </p>
      }
    />
  );
}
