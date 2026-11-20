'use client';

import {
  MAX_CARDS_PER_SET,
  type CardDraft,
  type SetFormInput,
  type SetFormValues,
} from '@vocab/shared';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
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

export const EMPTY_CARD: CardDraft = { term: '', definition: '', phonetic: '', example: '' };

type MoveDirection = 'up' | 'down';

interface CardFieldsProps {
  control: Control<SetFormInput, unknown, SetFormValues>;
  register: UseFormRegister<SetFormInput>;
  setFocus: UseFormSetFocus<SetFormInput>;
  errors: FieldErrors<SetFormInput>['cards'];
}

export function CardFields({ control, register, setFocus, errors }: CardFieldsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  // `id` là id thẻ trong database, nên khoá của dòng phải dùng tên khác.
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: 'cards',
    keyName: 'key',
  });
  const listError = errors?.root?.message ?? errors?.message;
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
        <h2 id="cards-title" className="text-h2">
          Thẻ <span className="tabular-nums">({fields.length})</span>
        </h2>
        <p className="text-small text-text-muted">
          Dòng để trống sẽ được bỏ qua. Xoá thẻ đã có sẽ xoá cả tiến độ học của thẻ đó khi bạn lưu.
        </p>
      </div>
      {listError ? (
        <p role="alert" className="text-small text-danger">
          {listError}
        </p>
      ) : null}
      {/* Khung cuộn riêng để trang không dài mãi khi có nhiều thẻ, nút thêm và lưu luôn gần tay. */}
      <div
        role="region"
        aria-label="Danh sách thẻ"
        tabIndex={0}
        className="max-h-[60dvh] min-h-48 overflow-y-auto overscroll-contain rounded-md border border-border bg-surface px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ol ref={listRef}>
          {fields.map((field, index) => {
            const number = index + 1;
            const cardErrors = errors?.[index];
            const titleId = `card-title-${field.key}`;
            return (
              <li
                key={field.key}
                data-card={index}
                aria-labelledby={titleId}
                className="flex flex-col gap-3 border-b border-border px-1 py-4 [contain-intrinsic-size:auto_260px] [content-visibility:auto] last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 id={titleId} className="text-h3 tabular-nums">
                    Thẻ {number}
                  </h3>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-move="up"
                      aria-label={`Đưa thẻ ${number} lên`}
                      disabled={index === 0}
                      onClick={() => moveCard(index, 'up')}
                    >
                      <ArrowUp aria-hidden className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-move="down"
                      aria-label={`Đưa thẻ ${number} xuống`}
                      disabled={index === fields.length - 1}
                      onClick={() => moveCard(index, 'down')}
                    >
                      <ArrowDown aria-hidden className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Xoá thẻ ${number}`}
                      onClick={() => requestRemove(index)}
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Từ"
                    error={cardErrors?.term?.message}
                    {...register(`cards.${index}.term`)}
                  />
                  <TextareaField
                    label="Nghĩa"
                    rows={1}
                    className="min-h-11"
                    error={cardErrors?.definition?.message}
                    {...register(`cards.${index}.definition`)}
                  />
                  <FormField
                    label="Phiên âm (không bắt buộc)"
                    className="font-phonetic"
                    error={cardErrors?.phonetic?.message}
                    {...register(`cards.${index}.phonetic`)}
                  />
                  <TextareaField
                    label="Ví dụ (không bắt buộc)"
                    rows={1}
                    className="min-h-11"
                    error={cardErrors?.example?.message}
                    {...register(`cards.${index}.example`)}
                  />
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
          Thêm thẻ
        </Button>
        {isFull ? (
          <p className="text-small text-text-muted">
            Một bộ từ có tối đa {MAX_CARDS_PER_SET.toLocaleString('vi-VN')} thẻ.
          </p>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title={`Xoá thẻ ${(pendingRemove ?? 0) + 1}?`}
        description="Thẻ sẽ bị bỏ khỏi bộ từ khi bạn lưu, kèm tiến độ học của thẻ đó."
        confirmLabel="Xoá thẻ"
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
