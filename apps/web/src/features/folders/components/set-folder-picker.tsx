'use client';

import { toast } from 'sonner';
import { SelectField } from '@/components/common/form-field';
import { formErrorMessage } from '@/lib/form-errors';
import { useFolders, useMoveSet } from '../hooks';

interface SetFolderPickerProps {
  setId: string;
  folderId: string | null;
}

/** Chủ bộ từ chọn thư mục. Chưa có thư mục nào thì không hiện. */
export function SetFolderPicker({ setId, folderId }: SetFolderPickerProps) {
  const folders = useFolders();
  const move = useMoveSet(setId);
  if (!folders.data || folders.data.data.length === 0) {
    return null;
  }

  return (
    <div className="w-full sm:w-64">
      <SelectField
        label="Thư mục"
        value={folderId ?? ''}
        disabled={move.isPending}
        onChange={(event) =>
          move.mutate(event.target.value || null, {
            onSuccess: () => toast.success('Đã chuyển thư mục'),
            onError: (error) => toast.error(formErrorMessage(error)),
          })
        }
      >
        <option value="">Không có thư mục</option>
        {folders.data.data.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
