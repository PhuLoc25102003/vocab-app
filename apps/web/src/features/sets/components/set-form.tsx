'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { setFormSchema, type SetFormValues, type Visibility } from '@vocab/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormError } from '@/components/common/form-message';
import { FormField, SelectField, TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';
import { LANGUAGE_LABELS, VISIBILITY_LABELS } from '../labels';

const FIELDS = ['title', 'description', 'termLang', 'defLang', 'visibility'] as const;
const SELECTABLE_VISIBILITY: readonly Visibility[] = ['PRIVATE', 'PUBLIC'];

export const EMPTY_SET_FORM: SetFormValues = {
  title: '',
  description: '',
  termLang: 'en',
  defLang: 'vi',
  visibility: 'PRIVATE',
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

interface SetFormProps {
  defaultValues: SetFormValues;
  onSubmit: (values: SetFormValues) => Promise<void>;
}

export function SetForm({ defaultValues, onSubmit }: SetFormProps) {
  const [initialValues] = useState(defaultValues);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SetFormValues>({
    resolver: zodResolver(setFormSchema),
    defaultValues: initialValues,
  });

  // Next giữ trang đã rời ở trạng thái ẩn. Effect chạy lại khi trang hiện ra,
  // nên người dùng không thấy dữ liệu của lần nhập trước.
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
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
          {languageOptions(defaultValues.termLang)}
        </SelectField>
        <SelectField
          label="Ngôn ngữ của nghĩa"
          error={errors.defLang?.message}
          {...register('defLang')}
        >
          {languageOptions(defaultValues.defLang)}
        </SelectField>
      </div>
      <SelectField
        label="Ai xem được"
        hint="Bộ từ công khai ai cũng xem được, kể cả người chưa đăng nhập."
        error={errors.visibility?.message}
        {...register('visibility')}
      >
        {withCurrent(SELECTABLE_VISIBILITY, defaultValues.visibility).map((visibility) => (
          <option key={visibility} value={visibility}>
            {VISIBILITY_LABELS[visibility]}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          Lưu bộ từ
        </Button>
        <Button asChild variant="secondary">
          <Link href="/sets">Huỷ</Link>
        </Button>
      </div>
    </form>
  );
}
