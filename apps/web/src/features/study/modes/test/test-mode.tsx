'use client';

import type { Question } from '@vocab/shared';
import { Check, ChevronUp, ClipboardCheck, ListChecks, PenLine } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AudioButton } from '@/components/common/audio-button';
import { CardImage } from '@/components/common/card-image';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { revealAboveKeyboard } from '@/lib/use-typing-focus';
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteId = useId();
  const shownAt = useRef(0);
  const submitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const blankCount = items.filter(({ id }) => !values[id]?.trim()).length;
  const answeredCount = items.length - blankCount;

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

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`test-q-${index}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6">
      {/* Danh sách câu hỏi */}
      <ol className="flex flex-col gap-6">
        {items.map((item, index) => {
          const number = index + 1;
          const promptLang = item.choices ? languages.term : languages.definition;
          const answerLang = item.choices ? languages.definition : languages.term;
          const isAnswered = Boolean(values[item.id]?.trim());

          return (
            <li
              key={item.id}
              id={`test-q-${index}`}
              className={cn(
                'glass-surface group relative flex scroll-mt-2 flex-col gap-5 rounded-2xl border p-5 transition-all sm:p-6',
                isAnswered
                  ? 'border-border-strong/60 shadow-sm'
                  : 'border-border hover:border-border-strong',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-small font-bold text-primary tabular-nums">
                    {t('test.question', { number })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-tiny font-medium text-primary">
                    {item.choices ? (
                      <>
                        <ListChecks aria-hidden className="size-3" />
                        {t('test.badgeChoice')}
                      </>
                    ) : (
                      <>
                        <PenLine aria-hidden className="size-3" />
                        {t('test.badgeWrite')}
                      </>
                    )}
                  </span>
                  {isAnswered ? (
                    <span
                      aria-hidden
                      className="inline-flex items-center gap-1 text-tiny text-success font-medium"
                    >
                      <Check className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Ảnh minh hoạ câu hỏi nếu có - căn giữa, cùng kích thước cân đối như các chế độ khác */}
                {item.imageUrl ? (
                  <div className="flex justify-center">
                    <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-2xs">
                      <CardImage
                        src={item.imageUrl}
                        alt={t('test.imageAlt')}
                        className="h-52 sm:h-64 w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Prompt câu hỏi & Audio */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-4">
                  <p
                    lang={promptLang}
                    className="min-w-0 font-card text-h2 font-bold break-words text-text"
                  >
                    {item.prompt}
                  </p>
                  <AudioButton
                    text={item.prompt}
                    lang={promptLang}
                    label={t(item.choices ? 'listenTerm' : 'listenDefinition')}
                    withSlow
                  />
                </div>
              </div>

              {/* Phần câu trả lời */}
              {item.choices ? (
                <fieldset className="grid gap-2.5 sm:grid-cols-2">
                  <legend className="sr-only">{t('test.chooseFor', { number })}</legend>
                  {item.choices.map((choice, choiceIndex) => {
                    const isSelected = values[item.id] === choice;
                    const letter = String.fromCharCode(65 + choiceIndex);
                    return (
                      <label
                        key={choice}
                        className={cn(
                          'group/opt relative flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-all duration-fast ease-standard',
                          isSelected
                            ? 'border-primary bg-primary-soft shadow-xs ring-1 ring-primary'
                            : 'border-border-strong bg-surface hover:border-primary/50 hover:bg-primary-soft/40',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-md text-tiny font-bold transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-fg'
                              : 'bg-muted text-text-muted group-hover/opt:bg-primary/10 group-hover/opt:text-primary',
                          )}
                        >
                          {letter}
                        </span>
                        <input
                          type="radio"
                          name={item.id}
                          value={choice}
                          checked={isSelected}
                          onChange={() => setValue(item.id, choice)}
                          data-answer={choiceIndex === 0 ? '' : undefined}
                          className="sr-only"
                        />
                        <span lang={answerLang} className="min-w-0 flex-1 font-medium break-words">
                          {choice}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Input
                    aria-label={t('test.typeFor', { number })}
                    lang={answerLang}
                    value={values[item.id] ?? ''}
                    placeholder={t('test.inputPlaceholder')}
                    maxLength={MAX_ANSWER_LENGTH}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-answer=""
                    onChange={(event) => setValue(item.id, event.target.value)}
                    onKeyDown={focusNext}
                    onFocus={(event) => revealAboveKeyboard(event.currentTarget.closest('li'))}
                    className="h-12 rounded-lg border-border-strong px-4 text-base focus-visible:ring-primary"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Thanh nộp bài dính dưới: bấm số câu đã làm để mở bảng nhảy tới từng câu, ở đâu cũng dùng được. */}
      <div className="glass-overlay sticky bottom-4 z-20 mt-4 flex flex-col gap-3 rounded-sheet p-4 group-data-[typing=true]/study:hidden">
        <div
          id={paletteId}
          className={cn(
            'grid transition-[grid-template-rows] duration-base ease-standard motion-reduce:transition-none',
            paletteOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div inert={!paletteOpen} className="min-h-0 overflow-hidden">
            <div
              role="group"
              aria-label={t('test.jumpTo')}
              className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pb-1"
            >
              {items.map((item, index) => {
                const isDone = Boolean(values[item.id]?.trim());
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPaletteOpen(false);
                      scrollToQuestion(index);
                    }}
                    aria-label={t('test.question', { number: index + 1 })}
                    className={cn(
                      'flex size-11 items-center justify-center rounded-full text-tiny font-semibold',
                      isDone ? 'glass-button-tint' : 'glass-button text-text-muted hover:text-text',
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <button
              type="button"
              aria-expanded={paletteOpen}
              aria-controls={paletteId}
              onClick={() => setPaletteOpen((open) => !open)}
              className="-mx-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-left text-small font-semibold hover:bg-primary-soft"
            >
              <ClipboardCheck aria-hidden className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                {t('test.answeredCount', { answered: answeredCount, total: items.length })}
              </span>
              {blankCount === 0 ? (
                <Check aria-label={t('test.allAnswered')} className="size-4 text-success" />
              ) : null}
              <ChevronUp
                aria-hidden
                className={cn(
                  'size-4 shrink-0 text-text-muted transition-transform duration-fast motion-reduce:transition-none',
                  paletteOpen ? '' : 'rotate-180',
                )}
              />
            </button>
            <span aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full bg-primary transition-[width] duration-base ease-standard"
                style={{ width: `${Math.round((answeredCount / (items.length || 1)) * 100)}%` }}
              />
            </span>
            {confirmBlank ? (
              <FormError>{t('test.blank', { count: blankCount })}</FormError>
            ) : (
              <p className="text-tiny text-text-muted">{t('test.intro')}</p>
            )}
          </div>
          <Button type="submit" className="h-11 w-full shrink-0 px-8 font-semibold sm:w-auto">
            {t(confirmBlank ? 'test.submitAnyway' : 'test.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
}
