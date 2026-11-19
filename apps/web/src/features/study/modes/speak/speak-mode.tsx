'use client';

import { getMode, gradeText, type GradeResult, type UserAnswer } from '@vocab/shared';
import { Check, Mic, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { isRecognitionSupported, ListenError, listenOnce } from '@/lib/speech-recognition';
import { cn } from '@/lib/utils';
import type { StudyModeProps } from '../views';

const FAILURE_MESSAGES = {
  unsupported: 'Trình duyệt này chưa nhận được giọng nói. Hãy dùng Chrome hoặc Edge, hoặc bỏ qua.',
  denied: 'Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này rồi thử lại.',
  'no-speech': 'Chưa nghe thấy gì. Hãy nói rõ hơn rồi thử lại.',
  failed: 'Không nhận được giọng nói. Hãy thử lại.',
} as const;

/**
 * Luyện nói: đọc to từ đang hiện. Điểm tính theo lần nói đầu, thử lại chỉ để luyện thêm.
 * Bỏ qua khi chưa nói lần nào thì gửi chuỗi rỗng.
 */
export function SpeakModeView({ question, languages, onAnswer, onChecked }: StudyModeProps) {
  const [supported] = useState(isRecognitionSupported);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [failure, setFailure] = useState<keyof typeof FAILURE_MESSAGES | null>(
    supported ? null : 'unsupported',
  );
  const shownAt = useRef(0);
  const first = useRef<UserAnswer | null>(null);
  const answered = useRef(false);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const speakNow = async () => {
    setListening(true);
    setFailure(null);
    try {
      const transcripts = await listenOnce(languages.term);
      // Lấy câu khớp từ đích nếu có trong các phương án, không thì lấy câu chắc chắn nhất.
      const value =
        transcripts.find((text) => gradeText(question.expected, text).isCorrect) ??
        transcripts[0] ??
        '';
      const answer = { questionId: question.id, value, timeMs: Date.now() - shownAt.current };
      setHeard(value);
      setResult(getMode(question.mode).grade(question, answer));
      if (!first.current) {
        first.current = answer;
        onChecked?.(answer);
      }
    } catch (error) {
      setFailure(error instanceof ListenError ? error.reason : 'failed');
    } finally {
      setListening(false);
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
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h1 lang={languages.term} className="min-w-0 font-card text-card-long break-words">
            {question.prompt}
          </h1>
          <AudioButton text={question.prompt} lang={languages.term} label="Nghe mẫu" />
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
            'flex items-center gap-2',
            result.isCorrect ? 'text-success' : 'text-danger',
          )}
        >
          {result.isCorrect ? (
            <Check aria-hidden className="size-5 shrink-0" />
          ) : (
            <X aria-hidden className="size-5 shrink-0" />
          )}
          <p className="min-w-0 break-words">
            {result.isCorrect ? 'Chính xác' : 'Chưa đúng'}. Bạn nói:{' '}
            <span lang={languages.term} className="font-card">
              {heard}
            </span>
          </p>
        </div>
      ) : null}
      {failure ? <FormError>{FAILURE_MESSAGES[failure]}</FormError> : null}

      <div className="mt-auto flex flex-col gap-2">
        {supported && !result?.isCorrect ? (
          <Button loading={listening} onClick={() => void speakNow()}>
            <Mic aria-hidden className="size-4" />
            {heard === null ? 'Bấm để nói' : 'Thử lại'}
          </Button>
        ) : null}
        <Button variant={result?.isCorrect ? 'primary' : 'secondary'} onClick={next}>
          {heard !== null ? 'Câu tiếp theo' : 'Bỏ qua'}
        </Button>
      </div>
    </div>
  );
}
