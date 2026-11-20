'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { folderInputSchema, type FolderInput } from '@vocab/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { applyFormError } from '@/lib/form-errors';

const FIELDS = ['name'] as const;

interface FolderNameFormProps {
  label: string;
  submitLabel: string;
  defaultName?: string;
  onSave: (name: string) => Promise<unknown>;
  onCancel: () => void;
}

/** Ô đặt tên thư mục ngay tại chỗ: Enter để lưu, Esc hoặc nút Huỷ để thôi. */
export function FolderNameForm({
  label,
  submitLabel,
  defaultName = '',
  onSave,
  onCancel,
}: FolderNameFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FolderInput>({
    resolver: zodResolver(folderInputSchema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => setFocus('name', { shouldSelect: true }), [setFocus]);

  const submit = handleSubmit(async ({ name }) => {
    try {
      await onSave(name);
    } catch (error) {
      const message = applyFormError(error, FIELDS, setError);
      if (message) {
        setError('name', { message });
      }
    }
  });

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onCancel();
        }
      }}
      noValidate
      className="flex flex-col gap-2"
    >
      <FormField label={label} error={errors.name?.message} {...register('name')} />
      <div className="flex gap-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
