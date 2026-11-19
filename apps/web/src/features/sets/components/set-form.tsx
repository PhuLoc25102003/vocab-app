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
import { useEffect, useRef, useState } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { FormField, SelectField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { useUnsavedGuard } from '../hooks/use-unsaved-guard';
import { LANGUAGE_LABELS, VISIBILITY_LABELS } from '../labels';
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

function languageOptions(current: string) {
  return withCurrent(Object.keys(LANGUAGE_LABELS), current).map((code) => (
    <option key={code} value={code}>
      {LANGUAGE_LABELS[code] ?? code}
    </option>
  ));
}

interface SetDetailsFieldsProps {
  initialValues: SetFormInput;
  register: UseFormRegister<SetFormInput>;
  errors: FieldErrors<SetFormInput>;
}

function SetDetailsFields({ initialValues, register, errors }: SetDetailsFieldsProps) {
  return (
    <>
      <FormField label="Tên bộ từ" error={errors.title?.message} {...register('title')} />
      <TextareaField
        label="Mô tả (không bắt buộc)"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Ngôn ngữ của từ"
          error={errors.termLang?.message}
          {...register('termLang')}
        >
          {languageOptions(initialValues.termLang)}
        </SelectField>
        <SelectField
          label="Ngôn ngữ của nghĩa"
          error={errors.defLang?.message}
          {...register('defLang')}
        >
          {languageOptions(initialValues.defLang)}
        </SelectField>
      </div>
      <SelectField
        label="Ai xem được"
        hint="Bộ từ công khai ai cũng xem được, kể cả người chưa đăng nhập."
        error={errors.visibility?.message}
        {...register('visibility')}
      >
        {withCurrent(SELECTABLE_VISIBILITY, initialValues.visibility).map((visibility) => (
          <option key={visibility} value={visibility}>
            {VISIBILITY_LABELS[visibility]}
          </option>
        ))}
      </SelectField>
    </>
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

  const releaseGuard = useUnsavedGuard(isDirty);

  const submit = handleSubmit(async (values) => {
    try {
      const nextHref = await onSubmit(values);
      await releaseGuard();
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
    <form onSubmit={submit} noValidate className="flex max-w-[720px] flex-col gap-6">
      {errors.root?.message ? <FormError>{errors.root.message}</FormError> : null}
      <SetDetailsFields initialValues={initialValues} register={register} errors={errors} />
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
