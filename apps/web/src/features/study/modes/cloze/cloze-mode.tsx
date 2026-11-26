'use client';

import { CLOZE_BLANK } from '@vocab/shared';
import { Fragment } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { TypedAnswer } from '../typed/typed-answer';
import type { StudyModeProps } from '../views';
import { useTranslation } from 'react-i18next';

/** Hiện chỗ trống thành gạch dưới, khi đã trả lời (đúng hoặc sai) thì điền đáp án chuẩn vào câu. */
function Sentence({ text, lang, answer }: { text: string; lang: string; answer?: string }) {
  const { t } = useTranslation('study');
  const parts = text.split(CLOZE_BLANK);
  return (
    <p lang={lang} className="min-w-0 font-card text-h1 break-words">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? (
            answer ? (
              <span className="mx-1 inline-block rounded-md bg-success-soft px-2 py-0.5 font-semibold text-success">
                {answer}
              </span>
            ) : (
              <span
                role="img"
                aria-label={t('cloze.blank')}
                className="mx-1 inline-block w-20 border-b-2 border-text align-baseline"
              />
            )
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
      prompt={(result) => {
        const completedSentence = result
          ? question.prompt.replaceAll(CLOZE_BLANK, result.expected)
          : null;
        return (
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Sentence text={question.prompt} lang={languages.term} answer={result?.expected} />
                {completedSentence ? (
                  <AudioButton
                    withSlow
                    text={completedSentence}
                    lang={languages.term}
                    label={t('listenTerm')}
                  />
                ) : null}
              </div>
              {question.hint ? (
                <p lang={languages.definition} className="text-text-muted break-words">
                  {t('cloze.hint', { hint: question.hint })}
                </p>
              ) : null}
            </div>
          </div>
        );
      }}
    />
  );
}
