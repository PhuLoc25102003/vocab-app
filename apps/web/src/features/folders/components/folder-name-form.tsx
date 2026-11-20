'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { folderInputSchema, type FolderInput } from '@vocab/shared';
import { useForm } from 'react-hook-form';
import { FormDialog } from '@/components/common/form-dialog';
import { FormField } from '@/components/common/form-field';
import { applyFormError } from '@/lib/form-errors';

const FIELDS = ['name'] as const;

interface FolderNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  submitLabel: string;
  defaultName?: string;
  onSave: (name: string) => Promise<unknown>;
}

/** Hộp thoại đặt tên thư mục khi tạo hoặc đổi tên. */
export function FolderNameDialog({
  open,
  onOpenChange,
  title,
  label,
  submitLabel,
  defaultName = '',
  onSave,
}: FolderNameDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FolderInput>({
    resolver: zodResolver(folderInputSchema),
    values: { name: defaultName },
  });

  const close = (next: boolean) => {
    if (!next) reset({ name: defaultName });
    onOpenChange(next);
  };

  const submit = handleSubmit(async ({ name }) => {
    try {
      await onSave(name);
      reset({ name: defaultName });
    } catch (error) {
      const message = applyFormError(error, FIELDS, setError);
      if (message) {
        setError('name', { message });
      }
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={title}
      submitLabel={submitLabel}
      pending={isSubmitting}
      dirty={isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <FormField label={label} error={errors.name?.message} {...register('name')} />
    </FormDialog>
  );
}
