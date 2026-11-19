'use client';

import { getMode, type GradeResult } from '@vocab/shared';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StudyModeProps } from '../views';
import { diffAnswer } from './answer-diff';

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
        setResult(getMode(question.mode).grade(question, answer));
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
      {prompt}

      <div className="flex flex-col gap-1">
        <label htmlFor="study-answer" className="text-small font-medium">
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
        />
      </div>

      <div role="status">
        {result?.isCorrect ? (
          <p className="flex items-center gap-2 rounded-md bg-success-soft p-3 text-success">
            <Check aria-hidden className="size-5 shrink-0" />
            Chính xác
          </p>
        ) : null}
        {result && !result.isCorrect ? (
          <div className="flex flex-col gap-2 rounded-md bg-danger-soft p-3">
            <p className="flex items-center gap-2 text-danger">
              <X aria-hidden className="size-5 shrink-0" />
              Chưa đúng
            </p>
            <WrongAnswer value={value} expected={result.expected} />
            <p className="text-small text-text-muted">Đáp án đúng</p>
            <p lang={languages.term} className="font-card text-h3 break-words text-success">
              {result.expected}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col">
        {result ? (
          <Button ref={nextRef} type="submit">
            Câu tiếp theo
          </Button>
        ) : (
          <Button type="submit" disabled={!value.trim()}>
            Kiểm tra
          </Button>
        )}
      </div>
    </form>
  );
}
