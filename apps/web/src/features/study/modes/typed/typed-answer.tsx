'use client';

import { getMode, type GradeResult } from '@vocab/shared';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StudyModeProps } from '../views';
import { diffAnswer } from './answer-diff';
import { playCorrectSound } from '@/lib/sound';
import { useTranslation } from 'react-i18next';

const MAX_ANSWER_LENGTH = 500;

interface TypedAnswerProps extends StudyModeProps {
  prompt: ReactNode;
  inputLabel: string;
}

function WrongAnswer({ value, expected }: { value: string; expected: string }) {
  const { before, wrong, after } = diffAnswer(value, expected);
  return (
    <p className="font-card text-h3 break-words">
      {before}
      <del className="text-danger decoration-danger-mark decoration-2">{wrong}</del>
      {after}
    </p>
  );
}

/** Khung chung của các chế độ gõ đáp án: gửi để chấm, xem kết quả, rồi sang câu sau. */
export function TypedAnswer({
  question,
  languages,
  onAnswer,
  onChecked,
  prompt,
  inputLabel,
}: TypedAnswerProps) {
  const { t } = useTranslation('study');
  const [value, setValue] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const shownAt = useRef(0);
  const timeMs = useRef(0);
  const answered = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (result) {
      nextRef.current?.focus();
    }
  }, [result]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!result) {
      if (value.trim()) {
        timeMs.current = Date.now() - shownAt.current;
        const answer = { questionId: question.id, value, timeMs: timeMs.current };
        const graded = getMode(question.mode).grade(question, answer);
        if (graded.isCorrect) playCorrectSound();
        setResult(graded);
        onChecked?.(answer);
      }
      return;
    }
    if (!answered.current) {
      answered.current = true;
      onAnswer({ questionId: question.id, value, timeMs: timeMs.current });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-sm">
        {prompt}

        <div className="flex flex-col gap-2">
          <label htmlFor="study-answer" className="text-small font-medium text-text-muted">
            {inputLabel}
          </label>
          <Input
            ref={inputRef}
            id="study-answer"
            lang={languages.term}
            value={value}
            maxLength={MAX_ANSWER_LENGTH}
            readOnly={result !== null}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setValue(event.target.value)}
            className="h-12 text-body"
          />
        </div>

        <div role="status">
          {result?.isCorrect ? (
            <p className="feedback-correct flex items-center gap-2 rounded-lg bg-success-soft p-4 font-medium text-success">
              <Check aria-hidden className="size-5 shrink-0" />
              {t('correct')}
            </p>
          ) : null}
          {result && !result.isCorrect ? (
            <div className="feedback-wrong flex flex-col gap-2 rounded-lg bg-danger-soft p-4">
              <p className="flex items-center gap-2 font-medium text-danger">
                <X aria-hidden className="size-5 shrink-0" />
                {t('wrong')}
              </p>
              <WrongAnswer value={value} expected={result.expected} />
              <p className="text-small text-text-muted">{t('expected')}</p>
              <p lang={languages.term} className="font-card text-h3 break-words text-success">
                {result.expected}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex flex-col">
        {result ? (
          <Button ref={nextRef} type="submit" className="h-11 font-medium">
            {t('nextQuestion')}
          </Button>
        ) : (
          <Button type="submit" disabled={!value.trim()} className="h-11 font-medium">
            {t('check')}
          </Button>
        )}
      </div>
    </form>
  );
}
