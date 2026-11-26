'use client';

import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';
import { useTranslation } from 'react-i18next';

export function WriteModeView(props: StudyModeProps) {
  const { t } = useTranslation('study');
  const { question, languages } = props;

  return (
    <TypedAnswer
      {...props}
      inputLabel={t('typeTerm')}
      prompt={
        <div className="flex flex-col gap-5">
          {question.imageUrl ? (
            <div className="flex justify-center">
              <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xs">
                <CardImage
                  src={question.imageUrl}
                  alt={t('write.imageAlt')}
                  className="h-52 sm:h-64 w-full object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-4">
            <p
              lang={languages.definition}
              className="min-w-0 text-h1 font-bold break-words text-text"
            >
              {question.prompt}
            </p>
            <AudioButton
              text={question.prompt}
              lang={languages.definition}
              label={t('listenDefinition')}
              withSlow
            />
          </div>
        </div>
      }
    />
  );
}
