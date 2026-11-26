'use client';

import type { Question, SessionResult } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Trans, useTranslation } from 'react-i18next';

interface StudyResultProps {
  result: SessionResult;
  questions: Question[];
  exitHref: Route;
  exitLabel?: string;
  onExit?: () => void;
  note?: ReactNode;
  onRestart: () => void;
  onRetryWrong: () => void;
}

/** Lời khích lệ theo tỉ lệ nhớ, để người học biết nên làm gì tiếp. */
export function encouragement(percent: number) {
  if (percent >= 90) return 'result.great' as const;
  if (percent >= 70) return 'result.good' as const;
  if (percent >= 40) return 'result.ok' as const;
  return 'result.start' as const;
}

export function StudyResult({
  result,
  questions,
  exitHref,
  exitLabel,
  onExit,
  note,
  onRestart,
  onRetryWrong,
}: StudyResultProps) {
  const { t } = useTranslation('study');
  const { correct, total } = result.session;
  const wrongIds = new Set(result.wrongCardIds);
  const wrong = questions.filter(({ cardId }) => wrongIds.has(cardId));
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <section
      aria-labelledby="study-result"
      className="glass-surface flex flex-col gap-6 rounded-2xl border border-border p-6 sm:p-8"
    >
      <div className="feedback-correct flex flex-col gap-3">
        <h1 id="study-result" className="text-h1">
          {t('result.done')}
        </h1>
        <p className="text-card tabular-nums text-primary">{percent}%</p>
        <div
          role="meter"
          aria-label={t('result.rate')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2.5 w-full overflow-hidden rounded-full bg-primary-soft"
        >
          <div
            className="h-full bg-primary transition-[width] duration-base ease-standard"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-text-muted">
          <Trans
            t={t}
            i18nKey="result.score"
            values={{ correct, total }}
            components={[
              <span key="c" className="font-semibold text-text tabular-nums" />,
              <span key="t" className="tabular-nums" />,
            ]}
          />
        </p>
        <p className="font-medium">{t(encouragement(percent))}</p>
      </div>

      {wrong.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-h3">{t('result.reviewMore')}</h2>
          <ul className="divide-y divide-border-strong/50 border-y border-border-strong/50">
            {wrong.map(({ id, prompt, expected }) => (
              <li key={id} className="flex flex-wrap justify-between gap-x-4 py-3">
                <span className="font-card break-words">{prompt}</span>
                <span className="break-words text-text-muted">{expected}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {note}

      <div className="flex flex-wrap gap-2">
        {wrong.length > 0 ? <Button onClick={onRetryWrong}>{t('result.retryWrong')}</Button> : null}
        <Button variant={wrong.length > 0 ? 'secondary' : 'primary'} onClick={onRestart}>
          {t('result.restart')}
        </Button>
        {onExit ? (
          <Button variant="secondary" onClick={onExit}>
            {exitLabel ?? t('result.backToSet')}
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href={exitHref}>{exitLabel ?? t('result.backToSet')}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
