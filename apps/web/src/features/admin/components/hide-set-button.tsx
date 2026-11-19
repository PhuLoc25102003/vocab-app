'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hideSetSchema, type HideSetDto } from '@vocab/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { TextareaField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { hideSet, unhideSet } from '../api';

// Mọi truy vấn bộ từ dùng khoá bắt đầu bằng 'sets', làm mới để thấy trạng thái ẩn.
const SETS_QUERY_KEY = ['sets'] as const;

interface HideSetButtonProps {
  setId: string;
  hidden: boolean;
}

/** Nút của ADMIN: ẩn bộ vi phạm kèm lý do, hoặc bỏ ẩn. */
export function HideSetButton({ setId, hidden }: HideSetButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY });
  const hide = useMutation({ mutationFn: (dto: HideSetDto) => hideSet(setId, dto.reason) });
  const unhide = useMutation({
    mutationFn: () => unhideSet(setId),
    onSuccess: async () => {
      await refresh();
      toast.success('Đã bỏ ẩn bộ từ');
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
        Bỏ ẩn bộ từ
      </Button>
    );
  }
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ẩn bộ từ
      </Button>
    );
  }

  const submit = form.handleSubmit(async (dto) => {
    try {
      await hide.mutateAsync(dto);
      await refresh();
      toast.success('Đã ẩn bộ từ khỏi người khác');
      setOpen(false);
      form.reset();
    } catch {
      // Lỗi hiện qua `hide.error`.
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-[480px] flex-col gap-3">
      {hide.error ? <FormError>{formErrorMessage(hide.error)}</FormError> : null}
      <TextareaField
        label="Lý do ẩn"
        rows={2}
        autoFocus
        error={form.formState.errors.reason?.message}
        {...form.register('reason')}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={hide.isPending}>
          Ẩn khỏi người khác
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
