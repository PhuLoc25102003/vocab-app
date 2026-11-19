'use client';

import { NO_FOLDER } from '@vocab/shared';
import { SelectField } from '@/components/common/form-field';
import { useFolders } from '../hooks';

interface FolderFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/** Không tải được thư mục thì ẩn ô lọc, danh sách bộ từ vẫn dùng được. */
export function FolderFilter({ value, onChange }: FolderFilterProps) {
  const folders = useFolders();
  if (folders.isError || (folders.data && folders.data.data.length === 0 && !value)) {
    return null;
  }

  return (
    <SelectField
      label="Thư mục"
      value={value}
      disabled={folders.isPending}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Tất cả</option>
      <option value={NO_FOLDER}>Chưa vào thư mục</option>
      {folders.data?.data.map(({ id, name, setCount }) => (
        <option key={id} value={id}>
          {name} ({setCount})
        </option>
      ))}
    </SelectField>
  );
}
