'use client';

import type { Question } from '@vocab/shared';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StudyModeProps } from '../views';
import { useTranslation } from 'react-i18next';

const MAX_ANSWER_LENGTH = 500;

/**
 * Một phần của bài kiểm tra: hiện mọi câu cùng lúc, không chấm từng câu.
 * Nộp bài thì gửi đáp án của cả phần, câu bỏ trống tính là sai, server chấm và trả kết quả.
 */
export function TestModeView({ question, round, languages, onAnswer }: StudyModeProps) {
  const { t } = useTranslation('study');
  const [items] = useState<Question[]>(() => (round?.length ? round : [question]));
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmBlank, setConfirmBlank] = useState(false);
  const shownAt = useRef(0);
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const blankCount = items.filter(({ id }) => !values[id]?.trim()).length;
  const setValue = (id: string, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
    setConfirmBlank(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitted.current) {
      return;
    }
    if (blankCount > 0 && !confirmBlank) {
      setConfirmBlank(true);
      return;
    }
    submitted.current = true;
    const timeMs = Math.round((Date.now() - shownAt.current) / items.length);
    for (const item of items) {
      onAnswer({ questionId: item.id, value: values[item.id]?.trim() ?? '', timeMs });
    }
  };

  // Enter trong ô gõ chuyển sang câu sau, không nộp cả bài.
  const focusNext = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    const fields = [...(formRef.current?.querySelectorAll<HTMLElement>('[data-answer]') ?? [])];
    fields[fields.indexOf(event.currentTarget) + 1]?.focus();
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6">
      <p className="text-small text-text-muted">{t('test.intro')}</p>
      <ol className="flex flex-col border-t border-border">
        {items.map((item, index) => {
          const number = index + 1;
          const promptLang = item.choices ? languages.term : languages.definition;
          const answerLang = item.choices ? languages.definition : languages.term;
          return (
            <li key={item.id} className="flex flex-col gap-3 border-b border-border py-4">
              <p className="flex gap-2">
                <span className="text-small text-text-muted tabular-nums">
                  {t('test.question', { number })}
                </span>
                <span lang={promptLang} className="min-w-0 font-card text-h3 break-words">
                  {item.prompt}
                </span>
              </p>
              {item.choices ? (
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">{t('test.chooseFor', { number })}</legend>
                  {item.choices.map((choice, choiceIndex) => (
                    <label
                      key={choice}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-surface px-3 py-1 has-checked:border-primary has-checked:bg-primary-soft"
                    >
                      <input
                        type="radio"
                        name={item.id}
                        value={choice}
                        checked={values[item.id] === choice}
                        onChange={() => setValue(item.id, choice)}
                        data-answer={choiceIndex === 0 ? '' : undefined}
                        className="size-11 shrink-0 accent-primary"
                      />
                      <span lang={answerLang} className="min-w-0 flex-1 break-words">
                        {choice}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <Input
                  aria-label={t('test.typeFor', { number })}
                  lang={answerLang}
                  value={values[item.id] ?? ''}
                  maxLength={MAX_ANSWER_LENGTH}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-answer=""
                  onChange={(event) => setValue(item.id, event.target.value)}
                  onKeyDown={focusNext}
                />
              )}
            </li>
          );
        })}
      </ol>
      {confirmBlank ? <FormError>{t('test.blank', { count: blankCount })}</FormError> : null}
      <div className="mt-auto flex flex-col">
        <Button type="submit">{t(confirmBlank ? 'test.submitAnyway' : 'test.submit')}</Button>
      </div>
    </form>
  );
}
