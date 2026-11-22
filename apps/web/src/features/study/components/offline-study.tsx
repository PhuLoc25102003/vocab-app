'use client';

import { ERROR_CODES, type SetDetail, type StudyMode } from '@vocab/shared';
import {
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Layers,
  ListChecks,
  Mic,
  PenLine,
  Shuffle,
  TextCursorInput,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { HttpError } from '@/lib/http';
import { addPendingSession, getOfflineSet } from '@/lib/offline-store';
import { createGuestBackend } from '../guest-backend';
import { StudyShell } from './study-shell';

type StudySlug =
  'flashcard' | 'learn' | 'write' | 'dictation' | 'mcq' | 'cloze' | 'match' | 'test' | 'speak';

interface OfflineStudyModeEntry {
  mode: StudyMode;
  slug: StudySlug;
  icon: LucideIcon;
}

const OFFLINE_MODES: readonly OfflineStudyModeEntry[] = [
  { mode: 'FLASHCARD', slug: 'flashcard', icon: Layers },
  { mode: 'LEARN', slug: 'learn', icon: GraduationCap },
  { mode: 'WRITE', slug: 'write', icon: PenLine },
  { mode: 'DICTATION', slug: 'dictation', icon: Headphones },
  { mode: 'MCQ', slug: 'mcq', icon: ListChecks },
  { mode: 'CLOZE', slug: 'cloze', icon: TextCursorInput },
  { mode: 'MATCH', slug: 'match', icon: Shuffle },
  { mode: 'TEST', slug: 'test', icon: ClipboardCheck },
  { mode: 'SPEAK', slug: 'speak', icon: Mic },
] as const;

interface OfflineStudyButtonProps {
  setId: string;
  set?: SetDetail;
}

/** Học bằng bộ từ đã tải về máy, cho phép chọn chế độ, kết quả vào hàng đợi để gửi khi có mạng. */
export function OfflineStudyButton({ setId, set }: OfflineStudyButtonProps) {
  const { t } = useTranslation('study');
  const { t: tSets } = useTranslation('sets');
  const { t: tCommon } = useTranslation('common');
  const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const [backend] = useState(() =>
    createGuestBackend({
      loadSet: async (id) => {
        if (set && set.id === id) {
          return set;
        }
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

  const handleSelectMode = (mode: StudyMode) => {
    setDialogOpen(false);
    setActiveMode(mode);
  };

  if (!activeMode) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setActiveMode('FLASHCARD')}>
          {t('offline.study')}
        </Button>
        <Button variant="secondary" onClick={() => setDialogOpen(true)}>
          <GraduationCap aria-hidden className="mr-1.5 size-4" />
          {t('offline.chooseMode')}
        </Button>

        <Dialog
          open={dialogOpen}
          onRequestClose={() => setDialogOpen(false)}
          labelledBy={titleId}
          describedBy={descriptionId}
          layout="sheet"
          size="lg"
        >
          <div className="flex max-h-[85dvh] flex-col overflow-hidden p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex flex-col gap-1">
                <h3 id={titleId} className="text-h3 font-semibold">
                  {t('offline.chooseModeTitle')}
                </h3>
                <p id={descriptionId} className="text-small text-text-muted">
                  {set ? `${set.title} • ` : ''}
                  {t('offline.chooseModeDescription')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={tCommon('actions.close')}
                onClick={() => setDialogOpen(false)}
              >
                <X aria-hidden className="size-5" />
              </Button>
            </div>

            <div className="mt-4 grid auto-rows-fr gap-3 overflow-y-auto p-1 sm:grid-cols-2 lg:grid-cols-3">
              {OFFLINE_MODES.map(({ mode, slug, icon: Icon }) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => handleSelectMode(mode)}
                  className="group flex min-h-[84px] w-full items-start gap-3.5 rounded-xl border border-border/80 bg-surface p-3.5 text-left transition-all duration-fast ease-standard hover:border-primary hover:bg-primary-soft shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:bg-surface border border-primary/20">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold text-body text-text group-hover:text-primary transition-colors">
                      {tSets(`modes.${slug}.label`)}
                    </span>
                    <span className="text-small text-text-muted leading-snug">
                      {tSets(`modes.${slug}.hint`)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  return (
    <StudyShell
      backend={backend}
      setId={setId}
      mode={activeMode}
      exitHref="/offline"
      exitLabel={t('offline.backToList')}
      onExit={() => setActiveMode(null)}
      resultNote={<p className="text-small text-text-muted">{t('offline.note')}</p>}
    />
  );
}
