'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lockUserSchema, type LockUserDto } from '@vocab/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { TextareaField } from '@/components/common/form-field';
import { formErrorMessage } from '@/lib/form-errors';
import { adminKeys, lockUser } from '../api';

export interface LockTargetUser {
  id: string;
  email: string;
  displayName?: string;
}

export interface LockDialogProps {
  user: LockTargetUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultReason?: string;
  onSuccess?: () => void;
}

export function LockDialog({
  user,
  open,
  onOpenChange,
  defaultReason = '',
  onSuccess,
}: LockDialogProps) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const lock = useMutation({ mutationFn: (dto: LockUserDto) => lockUser(user.id, dto.reason) });

  const form = useForm<LockUserDto>({
    resolver: zodResolver(lockUserSchema),
    defaultValues: { reason: defaultReason },
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: defaultReason });
    }
  }, [open, defaultReason, form]);

  const close = (next: boolean) => {
    if (!next) {
      form.reset({ reason: defaultReason });
      lock.reset();
    }
    onOpenChange(next);
  };

  const submit = form.handleSubmit(async (dto) => {
    try {
      await lock.mutateAsync(dto);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.users }),
        queryClient.invalidateQueries({ queryKey: adminKeys.classesOverview }),
        queryClient.invalidateQueries({ queryKey: adminKeys.stats }),
      ]);
      toast.success(t('lock.done', { email: user.email }));
      onSuccess?.();
      close(false);
    } catch {
      // Error displayed through formErrorMessage(lock.error)
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={t('lock.title', { email: user.email })}
      description={t('lock.description')}
      submitLabel={t('lock.submit')}
      pending={lock.isPending}
      error={lock.error ? formErrorMessage(lock.error) : null}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <TextareaField
        label={t('lock.reason')}
        rows={2}
        error={form.formState.errors.reason?.message}
        {...form.register('reason')}
      />
    </FormDialog>
  );
}
