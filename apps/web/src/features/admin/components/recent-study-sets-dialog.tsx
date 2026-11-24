'use client';

import type { AdminUser } from '@vocab/shared';
import { BookOpen, ExternalLink, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface RecentStudySetsDialogProps {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecentStudySetsDialog({ user, open, onOpenChange }: RecentStudySetsDialogProps) {
  const { t } = useTranslation('admin');
  const { t: tStudy } = useTranslation('study');
  const titleId = useId();
  const descId = useId();

  return (
    <Dialog
      open={open}
      onRequestClose={() => onOpenChange(false)}
      labelledBy={titleId}
      describedBy={descId}
      layout="centered"
      size="md"
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

        <div className="py-2">
          {!user.recentSets || user.recentSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
              <BookOpen aria-hidden className="size-10 mb-2 opacity-40" />
              <p className="text-small">{t('users.noRecentSets')}</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/60 max-h-[50vh] overflow-y-auto pr-1">
              {user.recentSets.map((set, index) => {
                const dateStr = new Date(set.startedAt).toLocaleString('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });
                const percent = set.total > 0 ? Math.round((set.correct / set.total) * 100) : null;

                return (
                  <div
                    key={`${set.setId}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sets/${set.setId}`}
                          className="font-medium text-text hover:text-primary transition-colors truncate block"
                          title={set.title}
                        >
                          {set.title}
                        </Link>
                        <Link
                          href={`/sets/${set.setId}`}
                          aria-label={t('users.viewSet')}
                          className="text-text-muted hover:text-primary transition-colors shrink-0"
                        >
                          <ExternalLink aria-hidden className="size-3.5" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-tiny text-text-muted">
                        <span className="inline-flex items-center rounded-sm bg-primary-soft px-1.5 py-0.5 font-medium text-primary uppercase text-[10px]">
                          {tStudy(`chain.${set.mode}`, { defaultValue: set.mode })}
                        </span>
                        {set.total > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium text-text">
                            <Trophy aria-hidden className="size-3 text-warning" />
                            {t('users.studyScore', {
                              correct: set.correct,
                              total: set.total,
                            })}{' '}
                            ({percent}%)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-tiny text-text-muted shrink-0 sm:text-right">
                      {dateStr}
                    </div>
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
