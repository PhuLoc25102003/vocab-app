'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hideSetSchema, type HideSetDto } from '@vocab/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormDialog } from '@/components/common/form-dialog';
import { TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { hideSet, unhideSet } from '../api';
import { useTranslation } from 'react-i18next';

// Mọi truy vấn bộ từ dùng khoá bắt đầu bằng 'sets', làm mới để thấy trạng thái ẩn.
const SETS_QUERY_KEY = ['sets'] as const;
export const ADMIN_STATS_QUERY_KEY = ['admin', 'stats'] as const;

interface HideSetButtonProps {
  setId: string;
  hidden: boolean;
}

/** Nút của ADMIN: ẩn bộ vi phạm kèm lý do, hoặc bỏ ẩn. */
export function HideSetButton({ setId, hidden }: HideSetButtonProps) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  // Số liệu và hàng chờ rà ở Tổng quan ADMIN cũng đổi khi ẩn hoặc bỏ ẩn.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'sets'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'hidden-sets'] }),
      queryClient.invalidateQueries({ queryKey: ADMIN_STATS_QUERY_KEY }),
    ]);
  const hide = useMutation({ mutationFn: (dto: HideSetDto) => hideSet(setId, dto.reason) });
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

  if (hidden) {
    return (
      <Button variant="secondary" loading={unhide.isPending} onClick={() => unhide.mutate()}>
        {t('hide.unhide')}
      </Button>
    );
  }
  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      hide.reset();
    }
    setOpen(next);
  };

  const submit = form.handleSubmit(async (dto) => {
    try {
      await hide.mutateAsync(dto);
      await refresh();
      toast.success(t('hide.hidden'));
      close(false);
    } catch {
      // Lỗi hiện qua `hide.error`.
    }
  });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('hide.hide')}
      </Button>
      <FormDialog
        open={open}
        onOpenChange={close}
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
    </>
  );
}
