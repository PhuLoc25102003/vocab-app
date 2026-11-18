import type { Question, SessionResult } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StudyResultProps {
  result: SessionResult;
  questions: Question[];
  exitHref: Route;
  onRestart: () => void;
}

export function StudyResult({ result, questions, exitHref, onRestart }: StudyResultProps) {
  const { correct, total } = result.session;
  const wrongIds = new Set(result.wrongCardIds);
  const wrong = questions.filter(({ cardId }) => wrongIds.has(cardId));

  return (
    <section aria-labelledby="study-result" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 id="study-result" className="text-h1">
          Đã xong phiên học
        </h1>
        <p className="text-text-muted">
          Bạn nhớ <span className="font-semibold text-text tabular-nums">{correct}</span> trên{' '}
          <span className="tabular-nums">{total}</span> thẻ.
        </p>
      </div>

      {wrong.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-h3">Cần ôn thêm</h2>
          <ul className="border-t border-border">
            {wrong.map(({ id, prompt, expected }) => (
              <li
                key={id}
                className="flex flex-wrap justify-between gap-x-4 border-b border-border py-3"
              >
                <span className="font-card break-words">{prompt}</span>
                <span className="break-words text-text-muted">{expected}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onRestart}>Học lại</Button>
        <Button asChild variant="secondary">
          <Link href={exitHref}>Về bộ từ</Link>
        </Button>
      </div>
    </section>
  );
}
