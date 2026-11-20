'use client';

import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';

export function WriteModeView(props: StudyModeProps) {
  const { question, languages } = props;

  return (
    <TypedAnswer
      {...props}
      inputLabel="Nhập từ"
      prompt={
        <div className="flex flex-col gap-3">
          {question.imageUrl ? (
            <CardImage
              src={question.imageUrl}
              alt="Ảnh minh hoạ cho nghĩa"
              className="aspect-[4/3] w-40"
            />
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <p lang={languages.definition} className="min-w-0 text-h1 break-words">
              {question.prompt}
            </p>
            <AudioButton text={question.prompt} lang={languages.definition} label="Nghe nghĩa" />
          </div>
        </div>
      }
    />
  );
}
