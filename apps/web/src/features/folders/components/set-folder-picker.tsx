'use client';

import { ChevronDown, Folder, FolderMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Menu,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useFolders, useMoveSet } from '../hooks';

interface SetFolderPickerProps {
  setId: string;
  folderId: string | null;
}

const NO_FOLDER = '';

/** Chip thư mục trên dòng thông tin bộ từ, bấm để chuyển. Chưa có thư mục nào thì không hiện. */
export function SetFolderPicker({ setId, folderId }: SetFolderPickerProps) {
  const folders = useFolders();
  const move = useMoveSet(setId);
  const list = folders.data?.data ?? [];
  if (list.length === 0) {
    return null;
  }

  const current = list.find(({ id }) => id === folderId);
  const choose = (value: string) => {
    const next = value === NO_FOLDER ? null : value;
    if (next === folderId) {
      return;
    }
    move.mutate(next, {
      onSuccess: () => toast.success(next ? 'Đã chuyển vào thư mục' : 'Đã gỡ khỏi thư mục'),
      onError: (error) => toast.error(formErrorMessage(error)),
    });
  };

  return (
    <Menu>
      <MenuTrigger
        disabled={move.isPending}
        aria-label={`Thư mục: ${current?.name ?? 'chưa xếp'}. Đổi thư mục`}
        className="inline-flex min-h-11 max-w-60 items-center gap-1.5 rounded-sm px-2 text-text transition-colors duration-fast ease-standard hover:bg-primary-soft disabled:opacity-50"
      >
        {current ? (
          <Folder aria-hidden className="size-4 shrink-0 text-primary" />
        ) : (
          <FolderMinus aria-hidden className="size-4 shrink-0 text-text-muted" />
        )}
        <span className="truncate">{current?.name ?? 'Chưa xếp thư mục'}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-text-muted" />
      </MenuTrigger>
      <MenuContent align="start" className="max-w-80">
        <MenuLabel>Chuyển vào thư mục</MenuLabel>
        <MenuRadioGroup value={folderId ?? NO_FOLDER} onValueChange={choose}>
          <MenuRadioItem value={NO_FOLDER}>Không có thư mục</MenuRadioItem>
          {list.map(({ id, name }) => (
            <MenuRadioItem key={id} value={id}>
              {name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
