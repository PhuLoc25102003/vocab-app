'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { folderInputSchema, type Folder, type FolderInput } from '@vocab/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/common/form-field';
import { FormError } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { applyFormError, formErrorMessage } from '@/lib/form-errors';
import { useCreateFolder, useDeleteFolder, useFolders, useRenameFolder } from '../hooks';

const FIELDS = ['name'] as const;

interface NameFormProps {
  label: string;
  submitLabel: string;
  defaultName?: string;
  onSave: (name: string) => Promise<unknown>;
  onCancel?: () => void;
}

function NameForm({ label, submitLabel, defaultName = '', onSave, onCancel }: NameFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FolderInput>({
    resolver: zodResolver(folderInputSchema),
    defaultValues: { name: defaultName },
  });

  const submit = handleSubmit(async ({ name }) => {
    try {
      await onSave(name);
      reset({ name: '' });
    } catch (error) {
      const message = applyFormError(error, FIELDS, setError);
      if (message) {
        setError('name', { message });
      }
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1 basis-48">
        <FormField label={label} error={errors.name?.message} {...register('name')} />
      </div>
      <div className="flex gap-2 sm:mt-6">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Huỷ
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FolderRow({ folder }: { folder: Folder }) {
  const [mode, setMode] = useState<'view' | 'rename' | 'confirm'>('view');
  const rename = useRenameFolder();
  const remove = useDeleteFolder();

  if (mode === 'rename') {
    return (
      <NameForm
        label={`Tên mới cho ${folder.name}`}
        submitLabel="Lưu"
        defaultName={folder.name}
        onSave={async (name) => {
          await rename.mutateAsync({ id: folder.id, name });
          setMode('view');
          toast.success('Đã đổi tên thư mục');
        }}
        onCancel={() => setMode('view')}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="min-w-0 flex-1 wrap-anywhere">
        {folder.name} <span className="text-small text-text-muted">({folder.setCount} bộ)</span>
      </p>
      {mode === 'confirm' ? (
        <div role="group" aria-label={`Xác nhận xoá ${folder.name}`} className="flex gap-2">
          <Button
            variant="secondary"
            className="text-danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(folder.id, {
                onSuccess: () => toast.success('Đã xoá thư mục, bộ từ vẫn được giữ'),
                onError: (error) => toast.error(formErrorMessage(error)),
              })
            }
          >
            Xoá thư mục
          </Button>
          <Button variant="ghost" onClick={() => setMode('view')}>
            Giữ lại
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            aria-label={`Đổi tên ${folder.name}`}
            onClick={() => setMode('rename')}
          >
            Đổi tên
          </Button>
          <Button
            variant="ghost"
            aria-label={`Xoá ${folder.name}`}
            onClick={() => setMode('confirm')}
          >
            Xoá
          </Button>
        </div>
      )}
    </div>
  );
}

/** Thu gọn mặc định để không chiếm chỗ của danh sách bộ từ. */
export function FolderManager() {
  const folders = useFolders();
  const create = useCreateFolder();

  return (
    <details className="rounded-lg border border-border bg-surface p-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-h3">
        Quản lý thư mục
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <NameForm
          label="Tên thư mục mới"
          submitLabel="Tạo thư mục"
          onSave={async (name) => {
            await create.mutateAsync(name);
            toast.success('Đã tạo thư mục');
          }}
        />
        {folders.isError ? (
          <FormError>Không tải được thư mục. Hãy kiểm tra mạng rồi thử lại.</FormError>
        ) : null}
        {folders.data?.data.length === 0 ? (
          <p className="text-small text-text-muted">Chưa có thư mục nào.</p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {folders.data?.data.map((folder) => (
            <li key={folder.id}>
              <FolderRow folder={folder} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
