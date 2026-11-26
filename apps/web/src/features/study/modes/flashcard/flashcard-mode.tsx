'use client';

import { FLASHCARD_ANSWERS } from '@vocab/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';
import { playCorrectSound } from '@/lib/sound';
import { useTranslation } from 'react-i18next';

const LONG_TEXT_LENGTH = 24;
const FACE =
  'col-start-1 row-start-1 flex min-h-72 items-center justify-center rounded-2xl p-6 sm:p-8 text-center backface-hidden';

const textSize = (text: string) =>
  text.length > LONG_TEXT_LENGTH ? 'text-card-long' : 'text-card';

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, input, textarea') !== null;
}

export function FlashcardMode({ question, languages, onAnswer }: StudyModeProps) {
  const { t } = useTranslation('study');
  const [flipped, setFlipped] = useState(false);
  const shownAt = useRef(0);
  const answered = useRef(false);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const answer = useCallback(
    (value: string) => {
      if (answered.current) {
        return;
      }
      answered.current = true;
      if (value === FLASHCARD_ANSWERS.known) playCorrectSound();
      onAnswer({ questionId: question.id, value, timeMs: Date.now() - shownAt.current });
    },
    [onAnswer, question.id],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      if (event.code === 'Space' && !isInteractive(event.target)) {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (flipped && event.key === '1') {
        answer(FLASHCARD_ANSWERS.unknown);
      } else if (flipped && event.key === '2') {
        answer(FLASHCARD_ANSWERS.known);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answer, flipped]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="relative perspective-distant">
        <div
          className={cn(
            'grid transition-transform duration-flip ease-standard transform-3d',
            flipped && 'rotate-y-180',
          )}
        >
          <div
            aria-hidden={flipped}
            className={cn(FACE, 'paper-grid border border-border shadow-raised')}
          >
            <p
              className={cn(
                'max-w-full rounded-md bg-surface px-3 font-card break-words',
                textSize(question.prompt),
              )}
            >
              {question.prompt}
            </p>
          </div>
          <div
            aria-hidden={!flipped}
            className={cn(FACE, 'rotate-y-180 flex-col gap-4 bg-board text-board-fg shadow-raised')}
          >
            {question.imageUrl ? (
              <CardImage
                src={question.imageUrl}
                alt={t('flashcard.imageAlt', { term: question.prompt })}
                className="max-h-36 w-auto max-w-full"
              />
            ) : null}
            <p className={cn('max-w-full font-card break-words', textSize(question.expected))}>
              {question.expected}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label={t(flipped ? 'flashcard.flipBack' : 'flashcard.flip')}
          onClick={() => setFlipped((value) => !value)}
          className="absolute inset-0 rounded-lg"
        />
        <div className="absolute top-2 right-2">
          {flipped ? (
            <AudioButton
              withSlow
              text={question.expected}
              lang={languages.definition}
              label={t('listenDefinition')}
            />
          ) : (
            <AudioButton
              withSlow
              text={question.prompt}
              lang={languages.term}
              label={t('listenTerm')}
            />
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {flipped ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => answer(FLASHCARD_ANSWERS.unknown)}>
              {t('flashcard.notYet')}
              <kbd className="hidden text-tiny text-text-muted pointer-fine:inline">1</kbd>
            </Button>
            <Button onClick={() => answer(FLASHCARD_ANSWERS.known)}>
              {t('flashcard.remembered')}
              <kbd className="hidden text-tiny pointer-fine:inline">2</kbd>
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setFlipped(true)}>
            {t('flashcard.showMeaning')}
            <kbd className="hidden text-tiny text-text-muted pointer-fine:inline">Space</kbd>
          </Button>
        )}
      </div>
    </div>
  );
}
