'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hideSetSchema, type HideSetDto } from '@vocab/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { FormDialog } from '@/components/common/form-dialog';
import { TextareaField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { cn } from '@/lib/utils';
import { hideSet, unhideSet } from '../api';
import { useTranslation } from 'react-i18next';

// Mọi truy vấn bộ từ dùng khoá bắt đầu bằng 'sets', làm mới để thấy trạng thái ẩn.
const SETS_QUERY_KEY = ['sets'] as const;
export const ADMIN_STATS_QUERY_KEY = ['admin', 'stats'] as const;

interface HideSetButtonProps {
  setId: string;
  hidden: boolean;
  className?: string;
}

/** Nút của ADMIN: ẩn bộ vi phạm kèm lý do, hoặc bỏ ẩn. */
export function HideSetButton({ setId, hidden, className }: HideSetButtonProps) {
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
      <Button
        variant="secondary"
        className={cn(
          'justify-center gap-1.5 text-small whitespace-nowrap h-9 px-3',
          className ?? 'w-full sm:w-auto',
        )}
        loading={unhide.isPending}
        onClick={() => unhide.mutate()}
      >
        <Eye aria-hidden className="size-4 shrink-0 text-success" />
        <span aria-hidden="true" className="sm:hidden">
          {t('hide.unhideShort')}
        </span>
        <span className="sr-only sm:not-sr-only">{t('hide.unhide')}</span>
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
      <Button
        variant="secondary"
        className={cn(
          'justify-center gap-1.5 text-small whitespace-nowrap h-9 px-3',
          className ?? 'w-full sm:w-auto',
        )}
        onClick={() => setOpen(true)}
      >
        <EyeOff aria-hidden className="size-4 shrink-0 text-danger" />
        <span aria-hidden="true" className="sm:hidden">
          {t('hide.hideShort')}
        </span>
        <span className="sr-only sm:not-sr-only">{t('hide.hide')}</span>
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
