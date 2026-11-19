'use client';

import { getMode, type Question } from '@vocab/shared';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';

interface Tile {
  /** Câu hỏi sở hữu nghĩa này. Hai thẻ trùng nghĩa vẫn là hai ô riêng. */
  id: string;
  text: string;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

/** Gọi trong sự kiện, không gọi khi render. */
function elapsedSince(start: number): number {
  return Date.now() - start;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const tileClass =
  'flex min-h-11 w-full items-center gap-2 rounded-md border border-border-strong bg-surface p-3 text-left break-words transition-colors duration-fast ease-standard enabled:hover:bg-primary-soft aria-pressed:border-primary aria-pressed:bg-primary-soft disabled:border-success disabled:bg-success-soft disabled:text-success';

/**
 * Ghép từ với nghĩa trong một vòng. Lần ghép đầu của mỗi từ quyết định đúng sai.
 * Đáp án được gửi theo thứ tự câu khi ghép xong cả vòng, để vị trí phiên học luôn khớp câu.
 */
export function MatchModeView({ question, round, languages, onAnswer }: StudyModeProps) {
  const [items] = useState<Question[]>(() => (round?.length ? round : [question]));
  const [tiles] = useState<Tile[]>(() =>
    shuffle(items.map(({ id, expected }) => ({ id, text: expected }))),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [usedTiles, setUsedTiles] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const answers = useRef(new Map<string, { value: string; timeMs: number }>());
  const sent = useRef(false);
  const done = matched.size === items.length;

  const termList = useRef<HTMLUListElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (done) {
      setElapsed(elapsedSince(startedAt.current));
      return;
    }
    const timer = window.setInterval(() => setElapsed(elapsedSince(startedAt.current)), 1000);
    return () => window.clearInterval(timer);
  }, [done]);

  const pickTile = (tile: Tile) => {
    const item = items.find(({ id }) => id === selected);
    if (!item) {
      setFeedback('Hãy chọn một từ trước.');
      return;
    }
    const timeMs = elapsedSince(startedAt.current);
    if (!answers.current.has(item.id)) {
      answers.current.set(item.id, { value: tile.text, timeMs });
    }
    const { isCorrect } = getMode(item.mode).grade(item, {
      questionId: item.id,
      value: tile.text,
      timeMs,
    });
    if (!isCorrect) {
      setFeedback(`Chưa đúng, "${tile.text}" không phải nghĩa của "${item.prompt}".`);
      return;
    }
    setMatched((current) => new Set(current).add(item.id));
    setUsedTiles((current) => new Set(current).add(tile.id));
    setSelected(null);
    // Ô vừa ghép bị khoá, nên đưa focus tới từ kế tiếp còn lại.
    requestAnimationFrame(() =>
      termList.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(),
    );
    setFeedback(`Đúng: ${item.prompt} là ${tile.text}.`);
  };

  const finishRound = () => {
    if (sent.current) {
      return;
    }
    sent.current = true;
    for (const item of items) {
      const answer = answers.current.get(item.id);
      if (answer) {
        onAnswer({ questionId: item.id, ...answer });
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-h2">Ghép từ với nghĩa</h1>
        <p className="text-small text-text-muted tabular-nums">
          <span className="sr-only">Thời gian </span>
          {formatElapsed(elapsed)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ul ref={termList} aria-label="Từ" className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                lang={languages.term}
                aria-pressed={selected === item.id}
                disabled={matched.has(item.id)}
                onClick={() => {
                  setSelected(item.id);
                  setFeedback('');
                }}
                className={cn(tileClass, 'font-card')}
              >
                <span className="min-w-0 flex-1">{item.prompt}</span>
                {matched.has(item.id) ? (
                  <Check aria-label="Đã ghép" className="size-4 shrink-0" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <ul aria-label="Nghĩa" className="flex flex-col gap-2">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <button
                type="button"
                lang={languages.definition}
                disabled={usedTiles.has(tile.id)}
                onClick={() => pickTile(tile)}
                className={tileClass}
              >
                <span className="min-w-0 flex-1">{tile.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p role="status" className="min-h-6 text-small">
        {done ? `Xong vòng trong ${formatElapsed(elapsed)}.` : feedback}
      </p>

      {done ? (
        <div className="mt-auto flex flex-col">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- đưa người dùng bàn phím tới bước tiếp */}
          <Button autoFocus onClick={finishRound}>
            Tiếp tục
          </Button>
        </div>
      ) : null}
    </div>
  );
}
