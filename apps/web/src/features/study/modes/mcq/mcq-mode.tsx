'use client';

import { getMode, type GradeResult } from '@vocab/shared';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';

export function McqModeView({ question, languages, onAnswer, onChecked }: StudyModeProps) {
  const choices = question.choices ?? [];
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
      setResult(getMode(question.mode).grade(question, answer));
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
      <div className="flex items-start justify-between gap-2">
        <h1 lang={languages.term} className="min-w-0 font-card text-card-long break-words">
          {question.prompt}
        </h1>
        <AudioButton text={question.prompt} lang={languages.term} label="Nghe phát âm" />
      </div>

      <ul className="flex flex-col gap-2">
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
                  'flex min-h-11 w-full items-center gap-3 rounded-md border border-border-strong bg-surface p-3 text-left transition-colors duration-fast ease-standard enabled:hover:bg-primary-soft',
                  isExpected && 'border-success bg-success-soft',
                  isWrongPick && 'border-danger bg-danger-soft',
                )}
              >
                <kbd className="hidden text-tiny text-text-muted pointer-fine:inline">
                  {index + 1}
                </kbd>
                <span lang={languages.definition} className="min-w-0 flex-1 break-words">
                  {choice}
                </span>
                {isExpected ? (
                  <Check aria-label="Đáp án đúng" className="size-5 shrink-0 text-success" />
                ) : null}
                {isWrongPick ? (
                  <X aria-label="Bạn đã chọn" className="size-5 shrink-0 text-danger" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <p
        role="status"
        className={cn(
          result?.isCorrect ? 'feedback-correct text-success' : 'text-danger',
          result && !result.isCorrect && 'feedback-wrong',
        )}
      >
        {result ? (result.isCorrect ? 'Chính xác' : 'Chưa đúng') : ''}
      </p>

      {result ? (
        <div className="mt-auto flex flex-col">
          <Button ref={nextRef} onClick={next}>
            Câu tiếp theo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
