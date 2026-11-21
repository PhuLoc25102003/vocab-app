'use client';

import { CLOZE_BLANK } from '@vocab/shared';
import { Fragment } from 'react';
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
        <div className="flex flex-col gap-2">
          <Sentence text={question.prompt} lang={languages.term} />
          {question.hint ? (
            <p lang={languages.definition} className="text-text-muted break-words">
              {t('cloze.hint', { hint: question.hint })}
            </p>
          ) : null}
        </div>
      }
    />
  );
}
