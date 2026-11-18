'use client';

import { AudioButton } from '@/components/common/audio-button';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';

export function WriteModeView(props: StudyModeProps) {
  const { question, languages } = props;

  return (
    <TypedAnswer
      {...props}
      inputLabel="Nhập từ"
      prompt={
        <div className="flex items-start justify-between gap-2">
          <p lang={languages.definition} className="min-w-0 text-h1 break-words">
            {question.prompt}
          </p>
          <AudioButton text={question.prompt} lang={languages.definition} label="Nghe nghĩa" />
        </div>
      }
    />
  );
}
