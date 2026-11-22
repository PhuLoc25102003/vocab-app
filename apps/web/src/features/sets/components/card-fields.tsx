'use client';

import {
  MAX_CARDS_PER_SET,
  type CardDraft,
  type SetFormInput,
  type SetFormValues,
} from '@vocab/shared';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetFocus,
} from 'react-hook-form';
import { FormField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { getUploadConfig, uploadKeys } from '@/lib/uploads';
import { CardImageField } from './card-image-field';
import { translateValidation } from '@/lib/validation-message';
import { useTranslation } from 'react-i18next';

export const EMPTY_CARD: CardDraft = { term: '', definition: '', phonetic: '', example: '' };

type MoveDirection = 'up' | 'down';

interface CardFieldsProps {
  control: Control<SetFormInput, unknown, SetFormValues>;
  register: UseFormRegister<SetFormInput>;
  setFocus: UseFormSetFocus<SetFormInput>;
  errors: FieldErrors<SetFormInput>['cards'];
}

export function CardFields({ control, register, setFocus, errors }: CardFieldsProps) {
  const { t, i18n } = useTranslation('sets');
  const listRef = useRef<HTMLOListElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  // `id` là id thẻ trong database, nên khoá của dòng phải dùng tên khác.
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: 'cards',
    keyName: 'key',
  });
  // Cấu hình tải ảnh lên và tìm ảnh trực tuyến.
  const uploads = useQuery({
    queryKey: uploadKeys.config,
    queryFn: getUploadConfig,
    staleTime: 5 * 60_000,
  });
  const canUpload = uploads.data?.images === true;
  const canSearch = uploads.data?.imageSearch === true;
  const imagesEnabled = canUpload || canSearch;
  const listError = translateValidation(errors?.root?.message ?? errors?.message);
  const isFull = fields.length >= MAX_CARDS_PER_SET;

  // Giữ focus ở nút vừa bấm để bấm tiếp được bằng bàn phím.
  const moveCard = (index: number, direction: MoveDirection) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    move(index, target);
    requestAnimationFrame(() => {
      const button = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-card="${target}"] [data-move="${direction}"]:not(:disabled)`,
      );
      if (button) {
        button.focus();
      } else {
        setFocus(`cards.${target}.term`);
      }
    });
  };

  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  /** Thẻ đã lưu hoặc đã gõ nội dung thì hỏi lại, dòng trống thì xoá ngay. */
  const requestRemove = (index: number) => {
    const row = listRef.current?.querySelector(`[data-card="${index}"]`);
    const typed = [...(row?.querySelectorAll<HTMLInputElement>('input, textarea') ?? [])].some(
      ({ value }) => value.trim() !== '',
    );
    if (fields[index]?.id || typed) {
      setPendingRemove(index);
    } else {
      removeCard(index);
    }
  };

  const removeCard = (index: number) => {
    remove(index);
    const next = Math.min(index, fields.length - 2);
    requestAnimationFrame(() => {
      if (next >= 0) {
        setFocus(`cards.${next}.term`);
      } else {
        addRef.current?.focus();
      }
    });
  };

  return (
    <section aria-labelledby="cards-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="cards-title" className="text-h3 font-semibold text-text">
          {t('cards.title')} <span className="tabular-nums">({fields.length})</span>
        </h2>
        <p className="text-small text-text-muted">{t('cards.hint')}</p>
      </div>
      {listError ? (
        <p role="alert" className="text-small text-danger">
          {listError}
        </p>
      ) : null}
      {/* Khung cuộn riêng để trang không dài mãi khi có nhiều thẻ, nút thêm và lưu luôn gần tay. */}
      <div
        role="region"
        aria-label={t('cards.list')}
        tabIndex={0}
        className="max-h-[60dvh] min-h-48 overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface/50 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ol ref={listRef} className="flex flex-col gap-4">
          {fields.map((field, index) => {
            const number = index + 1;
            const cardErrors = errors?.[index];
            const titleId = `card-title-${field.key}`;
            return (
              <li
                key={field.key}
                data-card={index}
                aria-labelledby={titleId}
                className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface p-4 shadow-sm [contain-intrinsic-size:auto_260px] [content-visibility:auto]"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 id={titleId} className="text-h3 tabular-nums">
                    {t('cards.card', { number })}
                  </h3>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-move="up"
                      aria-label={t('cards.moveUp', { number })}
                      disabled={index === 0}
                      onClick={() => moveCard(index, 'up')}
                    >
                      <ArrowUp aria-hidden className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-move="down"
                      aria-label={t('cards.moveDown', { number })}
                      disabled={index === fields.length - 1}
                      onClick={() => moveCard(index, 'down')}
                    >
                      <ArrowDown aria-hidden className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('cards.remove', { number })}
                      onClick={() => requestRemove(index)}
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label={t('cards.term')}
                    error={cardErrors?.term?.message}
                    {...register(`cards.${index}.term`)}
                  />
                  <TextareaField
                    label={t('cards.definition')}
                    rows={1}
                    className="min-h-11"
                    error={cardErrors?.definition?.message}
                    {...register(`cards.${index}.definition`)}
                  />
                  <FormField
                    label={t('cards.phonetic')}
                    className="font-phonetic"
                    error={cardErrors?.phonetic?.message}
                    {...register(`cards.${index}.phonetic`)}
                  />
                  <TextareaField
                    label={t('cards.example')}
                    rows={1}
                    className="min-h-11"
                    error={cardErrors?.example?.message}
                    {...register(`cards.${index}.example`)}
                  />
                  {imagesEnabled ? (
                    <CardImageField
                      control={control}
                      index={index}
                      canUpload={canUpload}
                      canSearch={canSearch}
                      error={cardErrors?.imageUrl?.message}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex flex-col items-start gap-1">
        <Button
          ref={addRef}
          variant="secondary"
          disabled={isFull}
          // Ô Từ của thẻ mới nhận focus, khung tự cuộn tới thẻ đó.
          onClick={() => append(EMPTY_CARD, { shouldFocus: true })}
        >
          <Plus aria-hidden className="size-5" />
          {t('cards.add')}
        </Button>
        {isFull ? (
          <p className="text-small text-text-muted">
            {t('cards.limit', { max: MAX_CARDS_PER_SET.toLocaleString(i18n.language) })}
          </p>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title={t('cards.removeTitle', { number: (pendingRemove ?? 0) + 1 })}
        description={t('cards.removeDescription')}
        confirmLabel={t('cards.removeConfirm')}
        onConfirm={() => {
          if (pendingRemove !== null) {
            removeCard(pendingRemove);
          }
          setPendingRemove(null);
        }}
      />
    </section>
  );
}
