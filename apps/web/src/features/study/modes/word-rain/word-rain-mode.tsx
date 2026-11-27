'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { WORD_RAIN_MIN_CARDS, type WordRainScoreResult, type WordRainStyle } from '@vocab/shared';
import { CloudRain, Keyboard, Mic, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { isRecognitionSupported } from '@/lib/speech-recognition';
import { cn } from '@/lib/utils';
import { getWordRainBest, saveWordRainScore, wordRainKeys } from '../../api';
import type { StudyModeProps } from '../views';
import type { RainResult, RainState } from './engine';
import { WordRainGame } from './word-rain-game';

type Phase = 'start' | 'playing' | 'done';

const STYLES = [
  { style: 'TYPE', icon: Keyboard, label: 'wordRain.styleType', hint: 'wordRain.styleTypeHint' },
  { style: 'SPEAK', icon: Mic, label: 'wordRain.styleSpeak', hint: 'wordRain.styleSpeakHint' },
] as const;

/**
 * Chế độ Mưa từ: màn bắt đầu (chọn Gõ hoặc Nói, luật chơi, điểm cao nhất), ván chơi và màn tổng
 * kết. Xong ván thì gửi mọi lượt trả lời; câu chưa kịp gặp được bỏ qua chứ không tính sai.
 */
export function WordRainModeView({ round, onAnswer, onSkip, sessionId, setId }: StudyModeProps) {
  const { t } = useTranslation('study');
  const questions = useMemo(
    () => (round ?? []).map(({ id, prompt, expected }) => ({ id, prompt, expected })),
    [round],
  );
  const speechSupported = useMemo(() => isRecognitionSupported(), []);
  const [phase, setPhase] = useState<Phase>('start');
  const [style, setStyle] = useState<WordRainStyle>('TYPE');
  /** Kiểu chơi lúc bắt đầu ván, để lưu điểm cao đúng bảng dù giữa ván đổi sang Gõ. */
  const [startedAs, setStartedAs] = useState<WordRainStyle>('TYPE');
  const [game, setGame] = useState(0);
  const [results, setResults] = useState<RainResult[]>([]);
  const [last, setLast] = useState<RainState | null>(null);
  // Khách học thử có phiên `guest-…` không lưu trên máy chủ, nên không có điểm cao.
  const canSave = Boolean(sessionId && setId && !sessionId.startsWith('guest-'));

  const best = useQuery({
    queryKey: wordRainKeys.best(setId ?? '', style),
    queryFn: () => getWordRainBest(setId ?? '', style),
    enabled: canSave,
    retry: false,
  });
  const save = useMutation({
    mutationFn: (state: RainState) =>
      saveWordRainScore(sessionId ?? '', {
        style: startedAs,
        score: state.score,
        wave: state.wave,
      }),
  });

  if (questions.length < WORD_RAIN_MIN_CARDS) {
    return (
      <EmptyState
        title={t('wordRain.tooFewTitle')}
        description={t('wordRain.tooFew', { count: WORD_RAIN_MIN_CARDS })}
      />
    );
  }

  const start = () => {
    setStartedAs(style);
    setGame((value) => value + 1);
    setPhase('playing');
  };

  const finish = (state: RainState) => {
    setResults((previous) => [...previous, ...state.results]);
    setLast(state);
    setPhase('done');
    if (canSave) save.mutate(state);
  };

  const submit = () => {
    const seen = new Set(results.map(({ questionId }) => questionId));
    for (const { questionId, value, timeMs } of results) {
      onAnswer({ questionId, value, timeMs });
    }
    for (const question of questions) {
      if (!seen.has(question.id)) onSkip?.();
    }
  };

  if (phase === 'playing') {
    return (
      <WordRainGame
        key={game}
        questions={questions}
        style={style}
        best={best.data?.score ?? null}
        onFinish={finish}
        onSwitchToTyping={() => setStyle('TYPE')}
      />
    );
  }

  if (phase === 'done' && last) {
    const record: WordRainScoreResult | undefined = save.data;
    const cleared = new Set(last.results.filter((r) => r.isCorrect).map((r) => r.questionId));
    const missed = questions.filter(
      ({ id }) => last.results.some((r) => r.questionId === id) && !cleared.has(id),
    );
    return (
      <section
        aria-labelledby="word-rain-done"
        className="glass-surface flex flex-col gap-5 rounded-2xl border border-border p-6 sm:p-8"
      >
        <div className="flex flex-col gap-2">
          <h2 id="word-rain-done" className="text-h1">
            {last.status === 'won' ? t('wordRain.won') : t('wordRain.over')}
          </h2>
          <p className="text-card tabular-nums text-primary">
            {t('wordRain.points', { score: last.score })}
          </p>
          {record?.isRecord ? (
            <p
              role="status"
              className="feedback-correct inline-flex w-fit items-center gap-2 rounded-full bg-highlight px-3 py-1 font-semibold text-highlight-fg"
            >
              <Trophy aria-hidden className="size-4" />
              {t('wordRain.newRecord')}
            </p>
          ) : record ? (
            <p className="text-small text-text-muted">
              {t('wordRain.best', { score: record.best.score })}
            </p>
          ) : null}
          <p className="text-text-muted">
            {t('wordRain.summary', {
              wave: last.wave,
              combo: last.bestCombo,
              cleared: cleared.size,
            })}
          </p>
        </div>
        {missed.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-h3">{t('wordRain.missed')}</h3>
            <ul className="divide-y divide-border-strong/50 border-y border-border-strong/50">
              {missed.map(({ id, prompt, expected }) => (
                <li key={id} className="flex flex-wrap justify-between gap-x-4 py-3">
                  <span className="font-card break-words">{expected}</span>
                  <span className="break-words text-text-muted">{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit}>{t('wordRain.seeResults')}</Button>
          <Button variant="secondary" onClick={start}>
            {t('wordRain.playAgain')}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="word-rain-title"
      className="glass-surface flex flex-col gap-5 rounded-2xl border border-border p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
        >
          <CloudRain className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="word-rain-title" className="text-h2">
            {t('wordRain.title')}
          </h2>
          <p className="text-text-muted">{t('wordRain.intro')}</p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t('wordRain.styleLabel')}
        className="grid gap-2 sm:grid-cols-2"
      >
        {STYLES.map(({ style: option, icon: Icon, label, hint }) => {
          const disabled = option === 'SPEAK' && !speechSupported;
          const checked = style === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => setStyle(option)}
              className={cn(
                'flex min-h-11 items-start gap-3 rounded-lg border p-4 text-left transition-colors duration-fast disabled:opacity-60',
                checked
                  ? 'border-primary bg-primary-soft'
                  : 'border-border-strong bg-surface hover:bg-primary-soft/50',
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  checked ? 'text-primary' : 'text-text-muted',
                )}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{t(label)}</span>
                <span className="text-small text-text-muted">
                  {disabled ? t('wordRain.speakUnsupported') : t(hint)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ul className="flex list-disc flex-col gap-1 pl-5 text-small text-text-muted">
        <li>{t(style === 'TYPE' ? 'wordRain.ruleType' : 'wordRain.ruleSpeak')}</li>
        <li>{t('wordRain.ruleShields')}</li>
        <li>{t('wordRain.ruleCombo')}</li>
        <li>{t('wordRain.rulePause')}</li>
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={start}>{t('wordRain.start')}</Button>
        {best.data ? (
          <span className="inline-flex items-center gap-1.5 text-small text-text-muted tabular-nums">
            <Trophy aria-hidden className="size-4 text-highlight" />
            {t('wordRain.best', { score: best.data.score })}
          </span>
        ) : null}
      </div>
    </section>
  );
}
