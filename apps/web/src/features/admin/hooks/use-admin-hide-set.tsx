'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hideSetSchema, type HideSetDto } from '@vocab/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { TextareaField } from '@/components/common/form-field';
import { formErrorMessage } from '@/lib/form-errors';
import { hideSet, unhideSet } from '../api';

export const SETS_QUERY_KEY = ['sets'] as const;
export const ADMIN_STATS_QUERY_KEY = ['admin', 'stats'] as const;

export function useAdminHideSet(setId: string) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ADMIN_STATS_QUERY_KEY }),
    ]);

  const hide = useMutation({
    mutationFn: (dto: HideSetDto) => hideSet(setId, dto.reason),
  });

  const unhide = useMutation({
    mutationFn: () => unhideSet(setId),
    onSuccess: async () => {
      await refresh();
      toast.success(t('hide.unhidden'));
    },
    onError: (error) => toast.error(formErrorMessage(error)),
  });

  const form = useForm<HideSetDto>({
    resolver: zodResolver(hideSetSchema),
    defaultValues: { reason: '' },
  });

  const closeDialog = (next: boolean) => {
    if (!next) {
      form.reset();
      hide.reset();
    }
    setDialogOpen(next);
  };

  const openHideDialog = () => {
    form.reset();
    hide.reset();
    setDialogOpen(true);
  };

  const submit = form.handleSubmit(async (dto) => {
    try {
      await hide.mutateAsync(dto);
      await refresh();
      toast.success(t('hide.hidden'));
      closeDialog(false);
    } catch {
      // Lỗi hiển thị qua hide.error
    }
  });

  const hideDialog = (
    <FormDialog
      open={dialogOpen}
      onOpenChange={closeDialog}
      title={t('hide.title')}
      description={t('hide.description')}
      submitLabel={t('hide.submit')}
      pending={hide.isPending}
      error={hide.error ? formErrorMessage(hide.error) : null}
      dirty={form.formState.isDirty}
      onSubmit={(event) => void submit(event)}
    >
      <TextareaField
        label={t('hide.reason')}
        rows={2}
        error={form.formState.errors.reason?.message}
        {...form.register('reason')}
      />
    </FormDialog>
  );

  return {
    openHideDialog,
    hideDialog,
    unhide: () => unhide.mutate(),
    isPending: hide.isPending || unhide.isPending,
  };
}
