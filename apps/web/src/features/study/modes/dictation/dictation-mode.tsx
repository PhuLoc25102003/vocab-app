'use client';

import { Snail, Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { useSpeechSupported } from '@/components/common/audio-button';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/speech';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';
import { useTranslation } from 'react-i18next';

export function DictationModeView(props: StudyModeProps) {
  const { t } = useTranslation('study');
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
        <h1 className="text-h2">{t('dictation.unsupported')}</h1>
        <p className="text-text-muted">{t('dictation.unsupportedHint')}</p>
        <Button
          variant="secondary"
          onClick={() => onAnswer({ questionId: question.id, value: '', timeMs: 0 })}
        >
          {t('dictation.skip')}
        </Button>
      </div>
    );
  }

  return (
    <TypedAnswer
      {...props}
      inputLabel={t('dictation.input')}
      prompt={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => speak(question.prompt, languages.term)}
          >
            <Volume2 aria-hidden className="size-5" />
            {t('dictation.replay')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => speak(question.prompt, languages.term, { slow: true })}
          >
            <Snail aria-hidden className="size-5" />
            {t('dictation.slow')}
          </Button>
        </div>
      }
    />
  );
}
