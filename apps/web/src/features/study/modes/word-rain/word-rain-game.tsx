'use client';

import type { WordRainStyle } from '@vocab/shared';
import {
  CircleAlert,
  Crosshair,
  Flame,
  Mic,
  Pause,
  Play,
  Shield,
  ShieldOff,
  Trophy,
  Waves,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { playGameSound } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  comboMultiplier,
  createGame,
  isTypeable,
  RAIN_RULES,
  releaseLock,
  setPaused,
  speak,
  tick,
  typeChar,
  type RainQuestion,
  type RainState,
} from './engine';
import { foldText, readInputChange } from './input-diff';
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
  /** Chữ đã gõ của mục tiêu đang khoá, hiện trong ô gõ (kể cả dấu câu được tự điền). */
  const typedRef = useRef('');
  /** Phần chữ (đã bỏ dấu) của ô gõ đã đưa vào engine. */
  const fedRef = useRef('');
  /** Bộ gõ đang soạn chữ (Telex, VNI, gợi ý từ): không được ghi đè ô gõ lúc này. */
  const composingRef = useRef(false);

  // Ô gõ không do React điều khiển: ghi đè giá trị giữa lúc bộ gõ đang soạn chữ làm bàn phím bị kẹt.
  const syncInput = () => {
    const input = inputRef.current;
    if (!input || composingRef.current) return;
    if (input.value !== typedRef.current) input.value = typedRef.current;
    fedRef.current = foldText(typedRef.current);
  };
  const [aimingAt, setAimingAt] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (next: RainState) => {
    const previous = stateRef.current;
    stateRef.current = next;
    const lockedTarget = next.targets.find(({ key }) => key === next.lockedKey);
    const nextTyped = lockedTarget ? lockedTarget.answer.slice(0, lockedTarget.typed) : '';
    typedRef.current = nextTyped;
    syncInput();
    setAimingAt(lockedTarget?.prompt ?? null);
    if (next.events.some(({ type }) => type === 'wrong')) {
      setWrong(true);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(false), 260);
    }
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
          setAnnounce(
            t('wordRain.locked', {
              prompt: target.prompt,
              count: [...target.answer].filter(isTypeable).length,
            }),
          );
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

  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

  // Bàn phím ảo trên điện thoại không gửi `key` đáng tin, nên so ô gõ với phần đã đưa vào engine.
  // Ngoài lúc bộ gõ đang soạn chữ, ô gõ hiện lại chữ đã gõ đúng của mục tiêu đang khoá.
  const consume = (value: string) => {
    const change = readInputChange(fedRef.current, value);
    fedRef.current = change.fed;
    if (change.kind === 'delete') {
      update(releaseLock(stateRef.current));
    } else if (change.kind === 'type' && change.chars.length > 0) {
      let next = stateRef.current;
      for (const char of change.chars) next = typeChar(next, char);
      update(next);
    }
    syncInput();
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => consume(event.currentTarget.value);

  const onCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    // Firefox gửi `input` cuối sau `compositionend`, nên đọc chữ còn lại trước khi trả ô gõ về.
    consume(event.currentTarget.value);
    composingRef.current = false;
    syncInput();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
    }
  };

  const paused = hud.status === 'paused';
  const multiplier = comboMultiplier(hud.combo);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-game-sky text-game-ink">
      <div
        ref={frameRef}
        className="relative"
        style={{
          height: viewportHeight
            ? Math.max(320, Math.min(620, viewportHeight - 210))
            : 'min(68vh, 620px)',
        }}
        onClick={() => style === 'TYPE' && inputRef.current?.focus()}
      >
        <canvas ref={canvasRef} className="block size-full" aria-hidden />

        {/* HUD phủ lên đỉnh khung chơi; renderer chừa khoảng này để mục tiêu không bị che. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 sm:p-3"
          aria-label={t('wordRain.hud')}
        >
          <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-game-glow/30 bg-game-panel px-3 py-1.5 text-small">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t('wordRain.score')}</dt>
              <Trophy aria-hidden className="size-4 text-highlight" />
              <dd className="font-semibold tabular-nums">{hud.score}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t('wordRain.combo')}</dt>
              <Flame
                aria-hidden
                className={cn('size-4', hud.combo > 0 ? 'text-highlight' : 'text-game-ink-muted')}
              />
              <dd className="tabular-nums">
                {hud.combo}
                {multiplier > 1 ? (
                  <span className="ml-1 font-semibold text-highlight">×{multiplier}</span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t('wordRain.waveLabel')}</dt>
              <Waves aria-hidden className="size-4 text-game-glow" />
              <dd className="tabular-nums">{hud.wave}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">{t('wordRain.shields', { count: hud.shields })}</dt>
              {Array.from({ length: RAIN_RULES.shields }, (_, index) =>
                index < hud.shields ? (
                  <Shield
                    key={index}
                    aria-hidden
                    className="size-4 fill-game-glow/25 text-game-glow"
                  />
                ) : (
                  <ShieldOff key={index} aria-hidden className="size-4 text-game-ink-muted" />
                ),
              )}
              <dd className="sr-only">{hud.shields}</dd>
            </div>
            {best !== null ? (
              <div className="hidden text-game-ink-muted tabular-nums sm:block">
                {t('wordRain.best', { score: best })}
              </div>
            ) : null}
          </dl>
          <Button
            variant="secondary"
            size="icon"
            aria-label={paused ? t('wordRain.resume') : t('wordRain.pause')}
            onClick={(event) => {
              event.stopPropagation();
              togglePause();
            }}
            className="pointer-events-auto rounded-full border-game-glow/30 bg-game-panel text-game-ink hover:bg-game-panel hover:text-highlight"
          >
            {paused ? (
              <Play aria-hidden className="size-5" />
            ) : (
              <Pause aria-hidden className="size-5" />
            )}
          </Button>
        </div>

        {paused ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-game-panel p-4 text-center">
            <p className="text-h3 text-game-ink">{t('wordRain.paused')}</p>
            <Button onClick={togglePause}>{t('wordRain.resume')}</Button>
          </div>
        ) : null}
      </div>

      {/* Bảng điều khiển dính liền khung chơi: ô gõ hoặc trạng thái micro. */}
      <div className="border-t border-game-glow/25 bg-game-panel p-3">
        {style === 'TYPE' ? (
          <label className="flex flex-col gap-2">
            <span className="flex min-h-5 items-center gap-2 text-small text-game-ink-muted">
              <Crosshair
                aria-hidden
                className={cn('size-4 shrink-0', aimingAt ? 'text-highlight' : 'text-game-glow')}
              />
              <span className="min-w-0 truncate">
                {aimingAt ? t('wordRain.aiming', { prompt: aimingAt }) : t('wordRain.typeHint')}
              </span>
            </span>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              defaultValue=""
              onChange={onInput}
              onCompositionStart={() => {
                composingRef.current = true;
              }}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={onKeyDown}
              aria-label={t('wordRain.input')}
              className={cn(
                'min-h-12 w-full rounded-md border bg-game-sky px-4 font-card text-h3 tracking-wide text-highlight caret-highlight outline-none transition-colors duration-fast focus-visible:border-highlight',
                wrong ? 'feedback-wrong border-danger' : 'border-game-glow/40',
              )}
            />
          </label>
        ) : (
          <div role="status" className="flex min-h-12 flex-wrap items-center gap-2 text-small">
            <Mic
              aria-hidden
              className={cn(
                'size-4',
                speech.listening
                  ? 'text-highlight motion-safe:animate-pulse'
                  : 'text-game-ink-muted',
              )}
            />
            <span>{speech.listening ? t('wordRain.listening') : t('wordRain.micIdle')}</span>
            {speech.heard ? (
              <span className="rounded-full border border-game-glow/30 bg-game-sky px-3 py-1 font-medium text-highlight">
                “{speech.heard}”
              </span>
            ) : null}
            {speech.error ? (
              <span className="flex flex-wrap items-center gap-2">
                <CircleAlert aria-hidden className="size-4 text-danger" />
                {t(speech.error === 'denied' ? 'wordRain.micDenied' : 'wordRain.micFailed')}
                <Button variant="secondary" onClick={onSwitchToTyping}>
                  {t('wordRain.switchToTyping')}
                </Button>
              </span>
            ) : null}
          </div>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
