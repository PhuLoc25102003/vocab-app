'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  setFormSchema,
  type SetFormInput,
  type SetFormValues,
  type Visibility,
} from '@vocab/shared';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { FormField, TextareaField } from '@/components/common/form-field';
import { VisibilityField } from '@/components/common/visibility-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { useUnsavedGuard } from '@/components/common/use-unsaved-guard';
import { CardFields, EMPTY_CARD } from './card-fields';
import { translateValidation } from '@/lib/validation-message';
import { useTranslation } from 'react-i18next';

const FIELDS = ['title', 'description', 'termLang', 'defLang', 'visibility'] as const;
const SELECTABLE_VISIBILITY: readonly Visibility[] = ['PRIVATE', 'PUBLIC'];

export const EMPTY_SET_FORM: SetFormInput = {
  title: '',
  description: '',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
  cards: [EMPTY_CARD, EMPTY_CARD],
};

/** Giữ giá trị đang lưu trong danh sách, kể cả khi form không cho chọn giá trị đó. */
function withCurrent<T extends string>(options: readonly T[], current: T): readonly T[] {
  return options.includes(current) ? options : [...options, current];
}

interface SetDetailsFieldsProps {
  initialValues: SetFormInput;
  register: UseFormRegister<SetFormInput>;
  errors: FieldErrors<SetFormInput>;
}

function SetDetailsFields({ initialValues, register, errors }: SetDetailsFieldsProps) {
  const { t } = useTranslation('sets');
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-strong bg-surface p-5 shadow-sm">
      <FormField label={t('form.title')} error={errors.title?.message} {...register('title')} />
      <TextareaField
        label={t('form.description')}
        rows={2}
        className="max-h-60 min-h-16 field-sizing-content"
        error={errors.description?.message}
        {...register('description')}
      />
      <VisibilityField
        options={withCurrent(SELECTABLE_VISIBILITY, initialValues.visibility)}
        error={errors.visibility?.message}
        {...register('visibility')}
      />
    </div>
  );
}

function hasContent({ title, description, cards }: SetFormInput): boolean {
  const filled = (value: string | null | undefined) => Boolean(value?.trim());
  return (
    filled(title) ||
    filled(description) ||
    cards.some(
      ({ term, definition, phonetic, example }) =>
        filled(term) || filled(definition) || filled(phonetic) || filled(example),
    )
  );
}

interface SetFormProps {
  cancelHref: Route;
  defaultValues: SetFormInput;
  /** Lưu dữ liệu và trả về trang cần tới. */
  onSubmit: (values: SetFormValues) => Promise<Route>;
  onRestart?: () => void;
  restartLabel?: string;
  submitLabel?: string;
}

export function SetForm({
  cancelHref,
  defaultValues,
  onSubmit,
  onRestart,
  restartLabel,
  submitLabel,
}: SetFormProps) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const [initialValues] = useState(defaultValues);
  const hasMounted = useRef(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    getValues,
    trigger,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SetFormInput, unknown, SetFormValues>({
    resolver: zodResolver(setFormSchema),
    defaultValues: initialValues,
  });

  // Next giữ trang đã rời ở trạng thái ẩn. Effect chạy lại khi trang hiện ra,
  // nên người dùng không thấy dữ liệu của lần nhập trước.
  useEffect(() => {
    if (hasMounted.current) {
      reset(initialValues);
    } else {
      // Nếu có thẻ được import (nhiều hơn thẻ trống ban đầu), trigger kiểm tra lỗi ngay để hiện cảnh báo
      const hasImportedCards = initialValues.cards.some((c) => c.term || c.definition);
      if (hasImportedCards) {
        void trigger();
      }
    }
    hasMounted.current = true;
  }, [initialValues, reset, trigger]);

  // Sửa bộ có sẵn thì mọi thay đổi đều đáng hỏi. Tạo bộ mới thì chỉ hỏi khi đã gõ nội dung,
  // không hỏi khi chỉ thêm rồi xoá dòng trống.
  const hasData = useCallback(
    () => hasContent(initialValues) || hasContent(getValues()),
    [getValues, initialValues],
  );
  const guard = useUnsavedGuard(isDirty, hasData);

  const submit = handleSubmit(async (values) => {
    try {
      const nextHref = await onSubmit(values);
      await guard.release();
      // Thay mục lịch sử để nút quay lại của trình duyệt không về form đã lưu.
      router.replace(nextHref);
    } catch (error) {
      const message = applyFormError(error, FIELDS, setError);
      if (message) {
        setError('root', { message });
      }
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-6">
      {guard.dialog}
      {errors.root?.message ? (
        <FormError>{translateValidation(errors.root.message)}</FormError>
      ) : null}
      <SetDetailsFields initialValues={initialValues} register={register} errors={errors} />
      <CardFields control={control} register={register} setFocus={setFocus} errors={errors.cards} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel ?? t('form.save')}
        </Button>
        {onRestart ? (
          <Button type="button" variant="secondary" onClick={onRestart}>
            {restartLabel ?? t('import.restart')}
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href={cancelHref}>{t('form.cancel')}</Link>
        </Button>
      </div>
    </form>
  );
}
