'use client';

import { ERROR_CODES } from '@vocab/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HttpError } from '@/lib/http';
import { addPendingSession, getOfflineSet } from '@/lib/offline-store';
import { createGuestBackend } from '../guest-backend';
import { StudyShell } from './study-shell';
import { useTranslation } from 'react-i18next';

/** Học Flashcard bằng bộ đã tải về máy, kết quả vào hàng đợi để gửi khi có mạng. */
export function OfflineStudyButton({ setId }: { setId: string }) {
  const { t } = useTranslation('study');
  const [active, setActive] = useState(false);
  const [backend] = useState(() =>
    createGuestBackend({
      loadSet: async (id) => {
        const entry = await getOfflineSet(id);
        if (!entry) {
          throw new HttpError(t('offline.notDownloaded'), 404, ERROR_CODES.SET_NOT_FOUND);
        }
        return entry.set;
      },
      onFinish: async ({ session, answers }) => {
        await addPendingSession({
          setId: session.setId,
          mode: session.mode,
          answers,
          finishedAt: session.finishedAt ?? new Date().toISOString(),
        });
      },
    }),
  );

  if (!active) {
    return (
      <Button variant="secondary" onClick={() => setActive(true)}>
        {t('offline.study')}
      </Button>
    );
  }
  return (
    <StudyShell
      backend={backend}
      setId={setId}
      mode="FLASHCARD"
      exitHref="/offline"
      resultNote={<p className="text-small text-text-muted">{t('offline.note')}</p>}
    />
  );
}
