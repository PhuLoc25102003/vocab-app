'use client';

import type { AdminRecentStudyMode, AdminUser } from '@vocab/shared';
import { BookOpen, CheckCircle2, Clock, ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RecentStudySetsDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecentStudySetsDialog({ user, open, onOpenChange }: RecentStudySetsDialogProps) {
  const { t, i18n } = useTranslation('admin');
  const titleId = useId();
  const descId = useId();
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

  return (
    <Dialog
      open={open}
      onRequestClose={() => onOpenChange(false)}
      labelledBy={titleId}
      describedBy={descId}
      layout="sheet"
      size="lg"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <BookOpen aria-hidden className="size-5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 id={titleId} className="text-h3 font-bold text-text leading-tight truncate">
              {t('users.recentSetsTitle', { name: user.displayName })}
            </h2>
            <p id={descId} className="text-small text-text-muted">
              {user.email} ·{' '}
              <span className={user.isOnline ? 'text-success font-medium' : 'text-text-muted'}>
                {user.isOnline ? t('users.online') : t('users.offline')}
              </span>
            </p>
          </div>
        </div>

        <div className="py-1">
          {!user.recentSets || user.recentSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
              <BookOpen aria-hidden className="size-10 mb-2 opacity-40" />
              <p className="text-small">{t('users.noRecentSets')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
              {user.recentSets.map((set, index) => {
                const modes: AdminRecentStudyMode[] =
                  set.modes && set.modes.length > 0
                    ? set.modes
                    : [
                        {
                          mode: set.mode,
                          startedAt: set.startedAt,
                          finishedAt: null,
                          answered: set.correct > 0 ? set.total : 0,
                          correct: set.correct,
                          total: set.total,
                        },
                      ];

                return (
                  <div
                    key={`${set.setId}-${index}`}
                    className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-elevated/20 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`/sets/${set.setId}`}
                          onClick={() => onOpenChange(false)}
                          className="font-semibold text-text hover:text-primary transition-colors truncate block"
                          title={set.title}
                        >
                          {set.title}
                        </Link>
                        <Link
                          href={`/sets/${set.setId}`}
                          onClick={() => onOpenChange(false)}
                          aria-label={t('users.viewSet')}
                          className="text-text-muted hover:text-primary transition-colors shrink-0"
                        >
                          <ExternalLink aria-hidden className="size-3.5" />
                        </Link>
                      </div>
                      {set.cardCount > 0 ? (
                        <span className="rounded-sm bg-surface-elevated px-2 py-0.5 text-tiny text-text-muted tabular-nums whitespace-nowrap shrink-0">
                          {t('users.setCardCount', { count: set.cardCount })}
                        </span>
                      ) : null}
                    </div>

                    <ul className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 bg-surface px-3">
                      {modes.map((m) => {
                        const dateStr = new Intl.DateTimeFormat(locale, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(m.startedAt));
                        const targetTotal =
                          set.cardCount > 0 ? Math.max(m.total, set.cardCount) : m.total;
                        const percent =
                          m.answered > 0 ? Math.round((m.correct / m.answered) * 100) : null;
                        const isFinished = m.finishedAt !== null;

                        return (
                          <li
                            key={m.mode}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 text-small"
                          >
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              <span className="inline-flex items-center rounded-sm bg-primary-soft px-2 py-0.5 font-medium text-primary uppercase text-tiny">
                                {t(`common:modes.${m.mode}`, { defaultValue: m.mode })}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-tiny font-medium',
                                  isFinished
                                    ? 'bg-success-soft text-success'
                                    : 'bg-surface-elevated text-text-muted',
                                )}
                              >
                                {isFinished ? (
                                  <CheckCircle2 aria-hidden className="size-3 shrink-0" />
                                ) : (
                                  <Clock aria-hidden className="size-3 shrink-0" />
                                )}
                                {isFinished ? t('users.modeFinished') : t('users.modeInProgress')}
                              </span>
                              {targetTotal > 0 ? (
                                <span className="text-tiny text-text-muted tabular-nums">
                                  {t('users.modeProgress', {
                                    answered: m.answered,
                                    total: targetTotal,
                                  })}
                                </span>
                              ) : null}
                              {m.answered > 0 && percent !== null ? (
                                <span className="inline-flex items-center gap-1 text-tiny font-medium text-text tabular-nums">
                                  <Trophy aria-hidden className="size-3 text-warning shrink-0" />
                                  {t('users.modeAccuracy', {
                                    correct: m.correct,
                                    answered: m.answered,
                                    percent,
                                  })}
                                </span>
                              ) : null}
                            </div>

                            <span className="text-tiny text-text-muted tabular-nums shrink-0 sm:text-right">
                              {dateStr}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('users.close')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
