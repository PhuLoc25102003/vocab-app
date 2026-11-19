'use client';

import { Snail, Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { useSpeechSupported } from '@/components/common/audio-button';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/speech';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';

export function DictationModeView(props: StudyModeProps) {
  const { question, languages, onAnswer } = props;
  const supported = useSpeechSupported();

  useEffect(() => {
    if (supported) {
      speak(question.prompt, languages.term);
    }
  }, [languages.term, question.prompt, supported]);

  if (!supported) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3">
        <h1 className="text-h2">Trình duyệt này không đọc được từ</h1>
        <p className="text-text-muted">
          Hãy mở bằng Chrome, Edge hoặc Safari để dùng chế độ Nghe viết.
        </p>
        <Button
          variant="secondary"
          onClick={() => onAnswer({ questionId: question.id, value: '', timeMs: 0 })}
        >
          Bỏ qua câu này
        </Button>
      </div>
    );
  }

  return (
    <TypedAnswer
      {...props}
      inputLabel="Nhập từ bạn nghe được"
      prompt={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => speak(question.prompt, languages.term)}
          >
            <Volume2 aria-hidden className="size-5" />
            Nghe lại
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => speak(question.prompt, languages.term, { slow: true })}
          >
            <Snail aria-hidden className="size-5" />
            Nghe chậm
          </Button>
        </div>
      }
    />
  );
}
