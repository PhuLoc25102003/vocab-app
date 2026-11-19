'use client';

import { getMode, type Question, type UserAnswer } from '@vocab/shared';
import { RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { McqModeView } from '../mcq/mcq-mode';
import type { StudyModeProps } from '../views';
import { WriteModeView } from '../write/write-mode';

interface Turn {
  question: Question;
  /** Lần hỏi thứ mấy của câu này trong vòng, bắt đầu từ 0. */
  attempt: number;
}

/**
 * Một vòng Learn: câu trắc nghiệm dùng view Trắc nghiệm, câu gõ từ dùng view Viết.
 * Câu sai được đưa xuống cuối vòng và hỏi lại tới khi đúng. Điểm tính theo lần trả lời đầu,
 * nên xong vòng mới gửi đáp án lần đầu của từng câu theo đúng thứ tự.
 */
export function LearnModeView({ question, round, languages, onAnswer }: StudyModeProps) {
  const [items] = useState<Question[]>(() => (round?.length ? round : [question]));
  const [queue, setQueue] = useState<Turn[]>(() =>
    items.map((item) => ({ question: item, attempt: 0 })),
  );
  const firstAnswers = useRef(new Map<string, UserAnswer>());
  const finished = useRef(false);

  const turn = queue[0];
  if (!turn) {
    return null;
  }
  const mastered = items.length - new Set(queue.map((item) => item.question.id)).size;

  const answerTurn = (answer: UserAnswer) => {
    if (!firstAnswers.current.has(answer.questionId)) {
      firstAnswers.current.set(answer.questionId, answer);
    }
    const { isCorrect } = getMode(turn.question.mode).grade(turn.question, answer);
    const rest = queue.slice(1);
    const next = isCorrect ? rest : [...rest, { ...turn, attempt: turn.attempt + 1 }];
    if (next.length > 0) {
      setQueue(next);
      return;
    }
    if (!finished.current) {
      finished.current = true;
      for (const item of items) {
        const first = firstAnswers.current.get(item.id);
        if (first) {
          onAnswer(first);
        }
      }
    }
  };

  const View = turn.question.choices ? McqModeView : WriteModeView;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-small text-text-muted">
        <p aria-live="polite">
          Vòng này đã thuộc <span className="tabular-nums">{mastered}</span>/
          <span className="tabular-nums">{items.length}</span> câu
        </p>
        {turn.attempt > 0 ? (
          <p className="flex items-center gap-1 text-primary">
            <RotateCcw aria-hidden className="size-4" />
            Hỏi lại câu trả lời sai
          </p>
        ) : null}
      </div>
      <View
        key={`${turn.question.id}-${turn.attempt}`}
        question={turn.question}
        languages={languages}
        onAnswer={answerTurn}
      />
    </div>
  );
}
