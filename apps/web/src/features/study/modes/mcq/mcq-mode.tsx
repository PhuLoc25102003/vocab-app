'use client';

import { getMode, type GradeResult } from '@vocab/shared';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';
import { playCorrectSound } from '@/lib/sound';
import { useTranslation } from 'react-i18next';

export function McqModeView({ question, languages, onAnswer, onChecked }: StudyModeProps) {
  const { t } = useTranslation('study');
  const choices = useMemo(() => question.choices ?? [], [question.choices]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const shownAt = useRef(0);
  const timeMs = useRef(0);
  const answered = useRef(false);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (result) {
      nextRef.current?.focus();
    }
  }, [result]);

  const choose = useCallback(
    (value: string) => {
      timeMs.current = Date.now() - shownAt.current;
      const answer = { questionId: question.id, value, timeMs: timeMs.current };
      setSelected(value);
      const graded = getMode(question.mode).grade(question, answer);
      if (graded.isCorrect) playCorrectSound();
      setResult(graded);
      onChecked?.(answer);
    },
    [onChecked, question],
  );

  const next = () => {
    if (selected !== null && !answered.current) {
      answered.current = true;
      onAnswer({ questionId: question.id, value: selected, timeMs: timeMs.current });
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (result || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const choice = choices[Number(event.key) - 1];
      if (choice !== undefined) {
        choose(choice);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, choose, result]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="glass-surface flex flex-col gap-6 rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-4">
          <h1 lang={languages.term} className="min-w-0 font-card text-card-long break-words">
            {question.prompt}
          </h1>
          <AudioButton
            text={question.prompt}
            lang={languages.term}
            label={t('listenTerm')}
            withSlow
          />
        </div>

        <ul className="flex flex-col gap-3">
          {choices.map((choice, index) => {
            const isExpected = result !== null && choice === result.expected;
            const isWrongPick = result !== null && choice === selected && !result.isCorrect;
            return (
              <li key={choice}>
                <button
                  type="button"
                  disabled={result !== null}
                  onClick={() => choose(choice)}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-bg/50 px-4 py-3 text-left transition-all duration-fast ease-standard enabled:hover:border-primary/50 enabled:hover:bg-primary-soft',
                    isExpected && 'border-success bg-success-soft font-medium text-success',
                    isWrongPick && 'border-danger bg-danger-soft text-danger',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface text-tiny font-bold text-text-muted"
                  >
                    {index + 1}
                  </span>
                  <span
                    lang={languages.definition}
                    className="min-w-0 flex-1 break-words font-medium"
                  >
                    {choice}
                  </span>
                  {isExpected ? (
                    <Check aria-label={t('expected')} className="size-5 shrink-0 text-success" />
                  ) : null}
                  {isWrongPick ? (
                    <X aria-label={t('mcq.yourChoice')} className="size-5 shrink-0 text-danger" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <p
          role="status"
          className={cn(
            'text-body font-medium',
            result?.isCorrect ? 'feedback-correct text-success' : 'text-danger',
            result && !result.isCorrect && 'feedback-wrong',
          )}
        >
          {result ? t(result.isCorrect ? 'correct' : 'wrong') : ''}
        </p>
      </div>

      {result ? (
        <div className="mt-auto flex flex-col">
          <Button ref={nextRef} onClick={next} className="h-11 font-medium">
            {t('nextQuestion')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
