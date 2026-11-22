'use client';

import { getMode, type Question } from '@vocab/shared';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';
import { playCorrectSound } from '@/lib/sound';
import { useTranslation } from 'react-i18next';

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
  'flex min-h-12 w-full items-center gap-2 rounded-lg border border-border/80 bg-bg/50 p-3.5 text-left break-words transition-all duration-fast ease-standard enabled:hover:border-primary/50 enabled:hover:bg-primary-soft aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:ring-1 aria-pressed:ring-primary disabled:border-success/60 disabled:bg-success-soft disabled:text-success shadow-2xs';

/**
 * Ghép từ với nghĩa trong một vòng. Lần ghép đầu của mỗi từ quyết định đúng sai.
 * Đáp án được gửi theo thứ tự câu khi ghép xong cả vòng, để vị trí phiên học luôn khớp câu.
 */
export function MatchModeView({ question, round, languages, onAnswer }: StudyModeProps) {
  const { t } = useTranslation('study');
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
      setFeedback(t('match.pickTermFirst'));
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
      setFeedback(t('match.wrongPair', { meaning: tile.text, term: item.prompt }));
      return;
    }
    playCorrectSound();
    setMatched((current) => new Set(current).add(item.id));
    setUsedTiles((current) => new Set(current).add(tile.id));
    setSelected(null);
    // Ô vừa ghép bị khoá, nên đưa focus tới từ kế tiếp còn lại.
    requestAnimationFrame(() =>
      termList.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(),
    );
    setFeedback(t('match.rightPair', { term: item.prompt, meaning: tile.text }));
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
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-4">
          <h1 className="text-h2 font-bold text-text">{t('match.title')}</h1>
          <div className="flex items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-1.5 text-small font-semibold text-primary">
            <span className="sr-only">{t('match.time')}</span>
            <span className="tabular-nums">{formatElapsed(elapsed)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ul ref={termList} aria-label={t('match.terms')} className="flex flex-col gap-2.5">
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
                  <span className="min-w-0 flex-1 wrap-anywhere font-medium">{item.prompt}</span>
                  {matched.has(item.id) ? (
                    <Check
                      aria-label={t('match.matched')}
                      className="size-4 shrink-0 text-success"
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <ul aria-label={t('match.meanings')} className="flex flex-col gap-2.5">
            {tiles.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  lang={languages.definition}
                  disabled={usedTiles.has(tile.id)}
                  onClick={() => pickTile(tile)}
                  className={tileClass}
                >
                  <span className="min-w-0 flex-1 wrap-anywhere">{tile.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p
          role="status"
          className={cn(
            'min-h-6 text-small font-medium transition-colors',
            done ? 'text-success' : 'text-text-muted',
          )}
        >
          {done ? t('match.done', { time: formatElapsed(elapsed) }) : feedback}
        </p>
      </div>

      {done ? (
        <div className="mt-auto flex flex-col">
          <Button autoFocus onClick={finishRound} className="h-11 font-medium">
            {t('match.continue')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
