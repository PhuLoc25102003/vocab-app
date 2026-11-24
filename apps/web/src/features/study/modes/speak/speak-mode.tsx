'use client';

import {
  getMode,
  gradeSpokenText,
  normalizeSpokenText,
  type GradeResult,
  type UserAnswer,
} from '@vocab/shared';
import { AlertCircle, Check, Mic, Square, X } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { isRecognitionSupported, ListenError, listenOnce } from '@/lib/speech-recognition';
import { loadSpeechSettings } from '@/lib/speech';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';
import { playCorrectSound } from '@/lib/sound';
import { useTranslation } from 'react-i18next';
import { UnsupportedSpeechDialog } from './unsupported-speech-dialog';

const FAILURE_MESSAGES = {
  unsupported: 'speak.unsupported',
  denied: 'speak.denied',
  'no-speech': 'speak.noSpeech',
  failed: 'speak.failed',
} as const;

const emptySubscribe = () => () => undefined;

/**
 * Luyện nói: đọc to từ đang hiện. Điểm tính theo lần nói đầu, thử lại chỉ để luyện thêm.
 * Bỏ qua khi chưa nói lần nào thì gửi chuỗi rỗng.
 */
export function SpeakModeView({ question, languages, onAnswer, onChecked }: StudyModeProps) {
  const { t } = useTranslation('study');
  const browserSupported = useSyncExternalStore(
    emptySubscribe,
    isRecognitionSupported,
    () => false,
  );
  const [runtimeUnsupported, setRuntimeUnsupported] = useState(false);
  const supported = browserSupported && !runtimeUnsupported;
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [failure, setFailure] = useState<keyof typeof FAILURE_MESSAGES | null>(null);
  const [unsupportedModalOpen, setUnsupportedModalOpen] = useState(false);
  const shownAt = useRef(0);
  const first = useRef<UserAnswer | null>(null);
  const answered = useRef(false);
  const listen = useRef<AbortController | null>(null);

  useEffect(() => {
    shownAt.current = Date.now();
    // Rời câu khi micro còn mở thì tắt micro.
    return () => listen.current?.abort();
  }, []);

  const speakNow = async () => {
    if (!supported) {
      setUnsupportedModalOpen(true);
      return;
    }
    const controller = new AbortController();
    listen.current = controller;
    setListening(true);
    setFailure(null);
    try {
      const userAccent = loadSpeechSettings().accent ?? 'en-US';
      const recognitionLang = languages.term === 'en' ? userAccent : languages.term;
      const transcripts = await listenOnce(recognitionLang, controller.signal);
      // Ưu tiên phương án khớp chính xác tuyệt đối trước, sau đó tới các phương án dung sai âm học
      const expectedNorm = normalizeSpokenText(question.expected);
      const value =
        transcripts.find((text) => normalizeSpokenText(text) === expectedNorm) ??
        transcripts.find((text) => gradeSpokenText(question.expected, text).isCorrect) ??
        transcripts[0] ??
        '';
      const answer = { questionId: question.id, value, timeMs: Date.now() - shownAt.current };
      setHeard(value);
      const graded = getMode(question.mode).grade(question, answer);
      if (graded.isCorrect) playCorrectSound();
      setResult(graded);
      if (!first.current) {
        first.current = answer;
        onChecked?.(answer);
      }
    } catch (error) {
      const reason = error instanceof ListenError ? error.reason : 'failed';
      if (reason === 'unsupported') {
        setRuntimeUnsupported(true);
        setUnsupportedModalOpen(true);
      }
      // Bấm Dừng không phải lỗi, chỉ quay về trạng thái chờ nói.
      if (reason !== 'aborted') {
        setFailure(reason);
      }
    } finally {
      listen.current = null;
      setListening(false);
    }
  };

  const toggleMic = () => {
    if (!supported || failure === 'unsupported') {
      setUnsupportedModalOpen(true);
      return;
    }
    if (listening) {
      listen.current?.abort();
    } else {
      void speakNow();
    }
  };

  const next = () => {
    if (answered.current) {
      return;
    }
    answered.current = true;
    onAnswer(
      first.current ?? {
        questionId: question.id,
        value: '',
        timeMs: Date.now() - shownAt.current,
      },
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-sm">
        {question.imageUrl ? (
          <div className="flex justify-center">
            <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xs">
              <CardImage
                src={question.imageUrl}
                alt={t('speak.imageAlt')}
                className="h-52 sm:h-64 w-full object-cover"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
          <div className="flex items-start justify-between gap-2">
            <h1 lang={languages.term} className="min-w-0 font-card text-card-long break-words">
              {question.prompt}
            </h1>
            <AudioButton text={question.prompt} lang={languages.term} label={t('speak.sample')} />
          </div>
          {question.hint ? (
            <p lang={languages.definition} className="text-text-muted break-words">
              {question.hint}
            </p>
          ) : null}
        </div>

        {heard !== null && result ? (
          <div
            role="status"
            className={cn(
              'flex items-center gap-2 rounded-lg p-4 font-medium',
              result.isCorrect
                ? 'feedback-correct bg-success-soft text-success'
                : 'feedback-wrong bg-danger-soft text-danger',
            )}
          >
            {result.isCorrect ? (
              <Check aria-hidden className="size-5 shrink-0" />
            ) : (
              <X aria-hidden className="size-5 shrink-0" />
            )}
            <p className="min-w-0 break-words">
              {t(result.isCorrect ? 'correct' : 'wrong')}. {t('speak.youSaid')}{' '}
              <span lang={languages.term} className="font-card">
                {heard}
              </span>
            </p>
          </div>
        ) : null}
        {failure ? (
          <div className="flex flex-col items-center gap-1.5">
            <FormError>{t(FAILURE_MESSAGES[failure])}</FormError>
            {failure === 'unsupported' || failure === 'failed' || failure === 'denied' ? (
              <button
                type="button"
                onClick={() => setUnsupportedModalOpen(true)}
                className="text-tiny font-medium text-primary underline underline-offset-4 hover:text-primary-hover cursor-pointer"
              >
                {t('speak.viewSupportedBrowsers')}
              </button>
            ) : null}
          </div>
        ) : null}

        {!result?.isCorrect ? (
          <div className="flex flex-col items-center gap-2 pt-2">
            {/* Một nút duy nhất đổi vai trò Nói, Dừng hoặc Mở modal hướng dẫn khi trình duyệt chưa hỗ trợ */}
            <button
              type="button"
              onClick={toggleMic}
              aria-label={t(
                !supported
                  ? 'speak.unsupportedDialogTitle'
                  : listening
                    ? 'speak.stop'
                    : heard === null
                      ? 'speak.start'
                      : 'speak.retry',
              )}
              className={cn(
                'flex size-16 items-center justify-center rounded-full border-2 transition-colors duration-fast ease-standard shadow-sm',
                !supported
                  ? 'border-warning/70 bg-warning-soft text-warning hover:bg-warning hover:text-warning-fg'
                  : listening
                    ? 'mic-listening border-primary bg-primary text-primary-fg'
                    : 'border-primary bg-primary-soft text-primary hover:bg-primary hover:text-primary-fg',
              )}
            >
              {!supported ? (
                <AlertCircle aria-hidden className="size-7" />
              ) : listening ? (
                <Square aria-hidden className="size-5 fill-current" />
              ) : (
                <Mic aria-hidden className="size-7" />
              )}
            </button>
            <p role="status" className="text-center text-small font-medium">
              {!supported ? (
                <span
                  className="text-warning font-semibold cursor-pointer"
                  onClick={() => setUnsupportedModalOpen(true)}
                >
                  {t('speak.unsupportedBadge')}
                </span>
              ) : listening ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Mic aria-hidden className="size-4" />
                  {t('speak.listening')}
                </span>
              ) : (
                <span className="text-text-muted">
                  {t(heard === null ? 'speak.tapMic' : 'speak.tapMicAgain')}
                </span>
              )}
            </p>
          </div>
        ) : null}
      </div>

      <UnsupportedSpeechDialog open={unsupportedModalOpen} onOpenChange={setUnsupportedModalOpen} />

      <div className="mt-auto flex flex-col">
        <Button
          variant={result?.isCorrect ? 'primary' : 'secondary'}
          onClick={next}
          className="h-11 font-medium"
        >
          {t(heard !== null ? 'nextQuestion' : 'speak.skip')}
        </Button>
      </div>
    </div>
  );
}
