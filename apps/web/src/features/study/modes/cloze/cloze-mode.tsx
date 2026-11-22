'use client';

import { CLOZE_BLANK } from '@vocab/shared';
import { Fragment } from 'react';
import { CardImage } from '@/components/common/card-image';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';
import { useTranslation } from 'react-i18next';

/** Hiện chỗ trống thành một gạch dưới rõ ràng, trình đọc màn hình đọc là "chỗ trống". */
function Sentence({ text, lang }: { text: string; lang: string }) {
  const { t } = useTranslation('study');
  const parts = text.split(CLOZE_BLANK);
  return (
    <p lang={lang} className="font-card text-h1 break-words">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? (
            <span
              role="img"
              aria-label={t('cloze.blank')}
              className="mx-1 inline-block w-20 border-b-2 border-text align-baseline"
            />
          ) : null}
        </Fragment>
      ))}
    </p>
  );
}

export function ClozeModeView(props: StudyModeProps) {
  const { t } = useTranslation('study');
  const { question, languages } = props;

  return (
    <TypedAnswer
      {...props}
      inputLabel={t('cloze.input')}
      prompt={
        <div className="flex flex-col gap-5">
          {question.imageUrl ? (
            <div className="flex justify-center">
              <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xs">
                <CardImage
                  src={question.imageUrl}
                  alt={t('cloze.imageAlt')}
                  className="h-52 sm:h-64 w-full object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
            <Sentence text={question.prompt} lang={languages.term} />
            {question.hint ? (
              <p lang={languages.definition} className="text-text-muted break-words">
                {t('cloze.hint', { hint: question.hint })}
              </p>
            ) : null}
          </div>
        </div>
      }
    />
  );
}
