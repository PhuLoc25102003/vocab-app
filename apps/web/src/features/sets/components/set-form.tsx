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
import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { FormField, SelectField, TextareaField } from '@/components/common/form-field';
import { VisibilityField } from '@/components/common/visibility-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { useUnsavedGuard } from '@/components/common/use-unsaved-guard';
import { LANGUAGE_LABELS } from '../labels';
import { CardFields, EMPTY_CARD } from './card-fields';

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

/** Cả hai ô ngôn ngữ cùng có hai giá trị đang lưu để đảo chiều không mất lựa chọn. */
function languageOptions({ termLang, defLang }: SetFormInput) {
  return withCurrent(withCurrent(Object.keys(LANGUAGE_LABELS), termLang), defLang).map((code) => (
    <option key={code} value={code}>
      {LANGUAGE_LABELS[code] ?? code}
    </option>
  ));
}

interface SetDetailsFieldsProps {
  initialValues: SetFormInput;
  register: UseFormRegister<SetFormInput>;
  errors: FieldErrors<SetFormInput>;
  onSwapLanguages: () => void;
}

function SetDetailsFields({
  initialValues,
  register,
  errors,
  onSwapLanguages,
}: SetDetailsFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tên bộ từ" error={errors.title?.message} {...register('title')} />
      <TextareaField
        label="Mô tả (không bắt buộc)"
        rows={2}
        className="max-h-60 min-h-16 field-sizing-content"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid gap-x-2 gap-y-2 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
        <SelectField
          label="Ngôn ngữ của từ"
          error={errors.termLang?.message}
          {...register('termLang')}
        >
          {languageOptions(initialValues)}
        </SelectField>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Đảo ngôn ngữ của từ và nghĩa"
          title="Đảo ngôn ngữ của từ và nghĩa"
          className="justify-self-center sm:mt-6"
          onClick={onSwapLanguages}
        >
          <ArrowLeftRight aria-hidden className="size-5 rotate-90 sm:rotate-0" />
        </Button>
        <SelectField
          label="Ngôn ngữ của nghĩa"
          error={errors.defLang?.message}
          {...register('defLang')}
        >
          {languageOptions(initialValues)}
        </SelectField>
      </div>
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
}

export function SetForm({ cancelHref, defaultValues, onSubmit }: SetFormProps) {
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
    setValue,
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
    }
    hasMounted.current = true;
  }, [initialValues, reset]);

  // Sửa bộ có sẵn thì mọi thay đổi đều đáng hỏi. Tạo bộ mới thì chỉ hỏi khi đã gõ nội dung,
  // không hỏi khi chỉ thêm rồi xoá dòng trống.
  const hasData = useCallback(
    () => hasContent(initialValues) || hasContent(getValues()),
    [getValues, initialValues],
  );
  const guard = useUnsavedGuard(isDirty, hasData);

  const swapLanguages = () => {
    const { termLang, defLang } = getValues();
    setValue('termLang', defLang, { shouldDirty: true });
    setValue('defLang', termLang, { shouldDirty: true });
  };

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
      {errors.root?.message ? <FormError>{errors.root.message}</FormError> : null}
      <SetDetailsFields
        initialValues={initialValues}
        register={register}
        errors={errors}
        onSwapLanguages={swapLanguages}
      />
      <CardFields control={control} register={register} setFocus={setFocus} errors={errors.cards} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          Lưu bộ từ
        </Button>
        <Button asChild variant="secondary">
          <Link href={cancelHref}>Huỷ</Link>
        </Button>
      </div>
    </form>
  );
}
