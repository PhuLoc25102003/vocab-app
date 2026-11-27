'use client';

import type { WordRainStyle } from '@vocab/shared';
import { Flame, Pause, Play, Shield, ShieldOff, Trophy, Waves } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { playGameSound } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  comboMultiplier,
  createGame,
  RAIN_RULES,
  releaseLock,
  setPaused,
  speak,
  tick,
  typeChar,
  type RainQuestion,
  type RainState,
} from './engine';
import { applyEvents, createFx, drawFrame, readPalette, type Fx } from './renderer';
import { useSpeechInput } from './use-speech-input';

interface WordRainGameProps {
  questions: readonly RainQuestion[];
  style: WordRainStyle;
  best: number | null;
  /** Gọi một lần khi thắng hoặc hết khiên. */
  onFinish: (state: RainState) => void;
  /** Kiểu Nói gặp lỗi micro: chuyển sang kiểu Gõ mà giữ ván đang chơi. */
  onSwitchToTyping: () => void;
}

/** Khung hình chậm hơn mức này (ms) trong 2 giây thì tự giảm hiệu ứng. */
const SLOW_FRAME_MS = 24;

function useReducedMotion(): boolean {
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return reduced;
}

/** Chiều cao khung chơi theo phần nhìn thấy được, để bàn phím ảo trên điện thoại không che máy bay. */
function useViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setHeight(viewport.height);
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }, []);
  return height;
}

export function WordRainGame({
  questions,
  style,
  best,
  onFinish,
  onSwitchToTyping,
}: WordRainGameProps) {
  const { t } = useTranslation('study');
  const reducedMotion = useReducedMotion();
  const viewportHeight = useViewportHeight();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initial] = useState(() => createGame(questions, style, Math.random));
  const [initialFx] = useState(() => createFx(Math.random, reducedMotion));
  const stateRef = useRef<RainState>(initial);
  const fxRef = useRef<Fx>(initialFx);
  const finishedRef = useRef(false);
  const [hud, setHud] = useState(initial);
  const [announce, setAnnounce] = useState('');

  const update = (next: RainState) => {
    const previous = stateRef.current;
    stateRef.current = next;
    const canvas = canvasRef.current;
    if (canvas) {
      applyEvents(
        fxRef.current,
        next.events,
        next,
        previous,
        { width: canvas.clientWidth, height: canvas.clientHeight },
        Math.random,
      );
    }
    for (const event of next.events) {
      if (event.type === 'shot') playGameSound('shot');
      if (event.type === 'destroy') playGameSound('boom');
      if (event.type === 'miss') playGameSound('miss');
      if (event.type === 'lock') {
        const target = next.targets.find(({ key }) => key === event.key);
        if (target) {
          setAnnounce(t('wordRain.locked', { prompt: target.prompt, count: target.answer.length }));
        }
      }
      if (event.type === 'wave') setAnnounce(t('wordRain.wave', { wave: event.wave }));
    }
    if ((next.status === 'over' || next.status === 'won') && !finishedRef.current) {
      finishedRef.current = true;
      setHud(next);
      onFinish(next);
    }
  };

  const speech = useSpeechInput({
    active: style === 'SPEAK' && hud.status === 'playing',
    onTranscripts: (transcripts) => {
      for (const transcript of transcripts) {
        const next = speak(stateRef.current, transcript);
        if (next.events.some(({ type }) => type === 'shot')) {
          update(next);
          return;
        }
      }
    },
  });

  // Micro lỗi giữa ván thì tạm dừng, chờ người học chuyển sang kiểu Gõ.
  useEffect(() => {
    if (speech.error) {
      update(setPaused(stateRef.current, true));
      setHud(stateRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.error]);

  // Vòng lặp khung hình: cập nhật engine, vẽ, và làm mới HUD khoảng 10 lần mỗi giây.
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let palette = readPalette(canvas);
    const themeObserver = new MutationObserver(() => {
      palette = readPalette(canvas);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    let frame = 0;
    let last = performance.now();
    let slowFor = 0;
    let hudAt = 0;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      if (dt > SLOW_FRAME_MS) slowFor += dt;
      else slowFor = Math.max(0, slowFor - dt);
      if (slowFor > 2000) fxRef.current.lite = true;

      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (
        canvas.width !== Math.round(width * ratio) ||
        canvas.height !== Math.round(height * ratio)
      ) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      update(tick(stateRef.current, dt, Math.random));
      drawFrame(
        context,
        stateRef.current,
        fxRef.current,
        palette,
        { width, height },
        now,
        dt / 1000,
      );
      if (now - hudAt > 100) {
        hudAt = now;
        setHud(stateRef.current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
    };
    // Vòng lặp chạy một lần cho mỗi ván; `update` đọc ref nên không cần chạy lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rời tab thì tạm dừng.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) update(setPaused(stateRef.current, true));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (style === 'TYPE') inputRef.current?.focus();
  }, [style]);

  const togglePause = () => {
    const paused = stateRef.current.status === 'paused';
    update(setPaused(stateRef.current, !paused));
    setHud(stateRef.current);
    if (paused) inputRef.current?.focus();
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    // Bàn phím ảo trên điện thoại không gửi `key` đáng tin, nên đọc chữ mới trong ô rồi xoá đi.
    const chars = event.currentTarget.value;
    event.currentTarget.value = '';
    let next = stateRef.current;
    for (const char of chars) next = typeChar(next, char);
    update(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      update(releaseLock(stateRef.current));
    }
  };

  const paused = hud.status === 'paused';
  const multiplier = comboMultiplier(hud.combo);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
        aria-label={t('wordRain.hud')}
      >
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t('wordRain.score')}</dt>
            <Trophy aria-hidden className="size-4 text-highlight" />
            <dd className="font-semibold tabular-nums">{hud.score}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t('wordRain.combo')}</dt>
            <Flame
              aria-hidden
              className={cn('size-4', hud.combo > 0 ? 'text-danger' : 'text-text-muted')}
            />
            <dd className="tabular-nums">
              {hud.combo}
              {multiplier > 1 ? (
                <span className="ml-1 font-semibold text-primary">×{multiplier}</span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t('wordRain.waveLabel')}</dt>
            <Waves aria-hidden className="size-4 text-primary" />
            <dd className="tabular-nums">{hud.wave}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">{t('wordRain.shields', { count: hud.shields })}</dt>
            {Array.from({ length: RAIN_RULES.shields }, (_, index) =>
              index < hud.shields ? (
                <Shield key={index} aria-hidden className="size-4 fill-primary-soft text-primary" />
              ) : (
                <ShieldOff key={index} aria-hidden className="size-4 text-text-muted" />
              ),
            )}
            <dd className="sr-only">{hud.shields}</dd>
          </div>
          {best !== null ? (
            <div className="text-text-muted tabular-nums">
              {t('wordRain.best', { score: best })}
            </div>
          ) : null}
        </dl>
        <Button
          variant="secondary"
          size="icon"
          aria-label={paused ? t('wordRain.resume') : t('wordRain.pause')}
          onClick={togglePause}
        >
          {paused ? (
            <Play aria-hidden className="size-5" />
          ) : (
            <Pause aria-hidden className="size-5" />
          )}
        </Button>
      </div>

      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-lg border border-border"
        style={{
          height: viewportHeight
            ? Math.max(320, Math.min(620, viewportHeight - 190))
            : 'min(70vh, 620px)',
        }}
        onClick={() => style === 'TYPE' && inputRef.current?.focus()}
      >
        <canvas ref={canvasRef} className="block size-full" aria-hidden />
        {paused ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-overlay p-4 text-center">
            <p className="text-h3 text-text">{t('wordRain.paused')}</p>
            <Button onClick={togglePause}>{t('wordRain.resume')}</Button>
          </div>
        ) : null}
      </div>

      {style === 'TYPE' ? (
        <label className="flex flex-col gap-1">
          <span className="text-small text-text-muted">{t('wordRain.typeHint')}</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            onChange={onInput}
            onKeyDown={onKeyDown}
            aria-label={t('wordRain.input')}
            className="min-h-11 rounded-md border border-border-strong bg-surface px-3 text-body font-card"
          />
        </label>
      ) : (
        <div role="status" className="flex min-h-11 flex-wrap items-center gap-2 text-small">
          <span
            aria-hidden
            className={cn(
              'size-2.5 rounded-full',
              speech.listening ? 'bg-danger motion-safe:animate-pulse' : 'bg-text-muted',
            )}
          />
          <span>{speech.listening ? t('wordRain.listening') : t('wordRain.micIdle')}</span>
          {speech.heard ? (
            <span className="rounded-full bg-primary-soft px-3 py-1 font-medium text-primary">
              “{speech.heard}”
            </span>
          ) : null}
          {speech.error ? (
            <span className="flex flex-wrap items-center gap-2 text-danger">
              {t(speech.error === 'denied' ? 'wordRain.micDenied' : 'wordRain.micFailed')}
              <Button variant="secondary" onClick={onSwitchToTyping}>
                {t('wordRain.switchToTyping')}
              </Button>
            </span>
          ) : null}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
