'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSetSchema, type ImportRow } from '@vocab/shared';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { FormField, SelectField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
import { LoadingState } from '@/components/common/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formErrorMessage } from '@/lib/form-errors';
import { HttpError } from '@/lib/http';
import { useUnsavedGuard } from '@/components/common/use-unsaved-guard';
import { getImportTarget, importAsNewSet, importIntoSet } from '../api';
import { ImportPreview } from './import-preview';
import { ImportSource, type ImportExtraColumns } from './import-source';

const newSetSchema = createSetSchema.pick({ title: true, visibility: true });
type NewSetInput = z.input<typeof newSetSchema>;
type NewSetValues = z.output<typeof newSetSchema>;

// Danh sách bộ từ dùng khoá bắt đầu bằng 'sets', làm mới để thấy số thẻ mới.
const SETS_QUERY_KEY = ['sets'] as const;

interface ImportWizardProps {
  /** Có thì thêm thẻ vào bộ này, không có thì tạo bộ mới. */
  setId?: string;
}

export function ImportWizard({ setId }: ImportWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [columns, setColumns] = useState<ImportExtraColumns>({ phonetic: false, example: false });
  const hasMounted = useRef(false);
  const target = useQuery({
    queryKey: [...SETS_QUERY_KEY, 'import-target', setId],
    queryFn: () => getImportTarget(setId ?? ''),
    enabled: Boolean(setId),
  });
  const save = useMutation({
    mutationFn: async (details: NewSetValues) => {
      const cards = (rows ?? []).map(({ term, definition, phonetic, example }) => ({
        term,
        definition,
        phonetic: phonetic?.trim() || undefined,
        example: example?.trim() || undefined,
      }));
      return setId ? importIntoSet(setId, cards) : importAsNewSet({ ...details, cards });
    },
  });
  const form = useForm<NewSetInput, unknown, NewSetValues>({
    resolver: zodResolver(newSetSchema),
    defaultValues: { title: '', visibility: 'PRIVATE' },
  });
  // Chỉ hỏi khi đã có dòng dữ liệu xem trước, trang trống thì rời tự do.
  const guard = useUnsavedGuard(Boolean(rows?.length) && !save.isSuccess);

  // Next giữ trang đã rời ở trạng thái ẩn, nên mở lại thì bắt đầu từ đầu.
  useEffect(() => {
    if (hasMounted.current) {
      setRows(null);
      save.reset();
      form.reset();
    }
    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi trang hiện lại
  }, []);

  if (setId && target.isPending) {
    return (
      <LoadingState label="Đang tải bộ từ">
        <Skeleton className="h-48 w-full" />
      </LoadingState>
    );
  }
  if (setId && target.isError) {
    const notFound = target.error instanceof HttpError && target.error.status === 404;
    return (
      <ErrorState
        title={notFound ? 'Không tìm thấy bộ từ' : 'Không tải được bộ từ'}
        description={
          notFound ? 'Bộ từ đã bị xoá hoặc bạn không có quyền.' : 'Hãy kiểm tra mạng rồi thử lại.'
        }
        onRetry={notFound ? undefined : () => void target.refetch()}
      />
    );
  }

  const targetNote = target.data ? (
    <p className="max-w-[65ch] text-text-muted wrap-anywhere">
      Thẻ sẽ được thêm vào cuối bộ “{target.data.title}”, bộ đang có {target.data.cardCount} thẻ.
    </p>
  ) : null;

  if (!rows) {
    return (
      <div className="flex flex-col gap-6">
        {targetNote}
        <ImportSource
          onPreview={(result, chosen) => {
            setColumns(chosen);
            setRows(result.rows);
          }}
        />
      </div>
    );
  }

  const restart = () => {
    setRows(null);
    save.reset();
  };
  const invalidCount = rows.filter(({ errors }) => errors.length > 0).length;
  const saveWith = async (details: NewSetValues) => {
    try {
      const id = await save.mutateAsync(details);
      await queryClient.invalidateQueries({ queryKey: SETS_QUERY_KEY });
      toast.success(`Đã nhập ${rows.length} thẻ`);
      await guard.release();
      router.replace(`/sets/${id}` as Route);
    } catch {
      // Lỗi hiện qua `save.error`.
    }
  };
  // Thêm vào bộ có sẵn thì không có ô tên bộ mới để kiểm tra.
  const submit = setId
    ? (event: FormEvent) => {
        event.preventDefault();
        void saveWith({ title: '', visibility: 'PRIVATE' });
      }
    : form.handleSubmit(saveWith);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Không còn dòng nào để nhập"
        description="Hãy dán lại danh sách hoặc chọn file khác."
        action={<Button onClick={restart}>Nhập lại</Button>}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {guard.dialog}
      <ImportPreview rows={rows} columns={columns} onChange={setRows} />
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-4 border-t border-border pt-6"
      >
        <h2 className="text-h2">Lưu</h2>
        {save.error ? <FormError>{formErrorMessage(save.error)}</FormError> : null}
        {targetNote ?? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Tên bộ từ mới"
              error={form.formState.errors.title?.message}
              {...form.register('title')}
            />
            <SelectField label="Ai xem được" {...form.register('visibility')}>
              <option value="PRIVATE">Riêng tư</option>
              <option value="PUBLIC">Công khai</option>
            </SelectField>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={save.isPending} disabled={invalidCount > 0}>
            Lưu {rows.length} thẻ
          </Button>
          <Button type="button" variant="secondary" onClick={restart}>
            Nhập lại
          </Button>
        </div>
      </form>
    </div>
  );
}
