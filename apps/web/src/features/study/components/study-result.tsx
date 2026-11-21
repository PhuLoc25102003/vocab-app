import type { Question, SessionResult } from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface StudyResultProps {
  result: SessionResult;
  questions: Question[];
  exitHref: Route;
  exitLabel?: string;
  note?: ReactNode;
  onRestart: () => void;
  onRetryWrong: () => void;
}

/** Lời khích lệ theo tỉ lệ nhớ, để người học biết nên làm gì tiếp. */
export function encouragement(percent: number): string {
  if (percent >= 90) return 'Xuất sắc! Bạn nhớ gần như toàn bộ.';
  if (percent >= 70) return 'Làm tốt lắm! Ôn thêm vài thẻ là thuộc hết.';
  if (percent >= 40) return 'Khá ổn. Học lại các thẻ sai để nhớ chắc hơn.';
  return 'Khởi đầu nào cũng cần thời gian. Học lại các thẻ sai nhé.';
}

export function StudyResult({
  result,
  questions,
  exitHref,
  exitLabel = 'Về bộ từ',
  note,
  onRestart,
  onRetryWrong,
}: StudyResultProps) {
  const { correct, total } = result.session;
  const wrongIds = new Set(result.wrongCardIds);
  const wrong = questions.filter(({ cardId }) => wrongIds.has(cardId));
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <section aria-labelledby="study-result" className="flex flex-col gap-6">
      <div className="feedback-correct flex flex-col gap-3">
        <h1 id="study-result" className="text-h1">
          Đã xong phiên học
        </h1>
        <p className="text-card tabular-nums text-primary">{percent}%</p>
        <div
          role="meter"
          aria-label="Tỉ lệ nhớ"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 w-full overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full bg-primary transition-[width] duration-base ease-standard"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-text-muted">
          Bạn nhớ <span className="font-semibold text-text tabular-nums">{correct}</span> trên{' '}
          <span className="tabular-nums">{total}</span> thẻ.
        </p>
        <p className="font-medium">{encouragement(percent)}</p>
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

      {note}

      <div className="flex flex-wrap gap-2">
        {wrong.length > 0 ? <Button onClick={onRetryWrong}>Học lại thẻ sai</Button> : null}
        <Button variant={wrong.length > 0 ? 'secondary' : 'primary'} onClick={onRestart}>
          Học lại từ đầu
        </Button>
        <Button asChild variant="secondary">
          <Link href={exitHref}>{exitLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
