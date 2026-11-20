'use client';

import { ChevronDown, Folder, FolderInput, FolderMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Menu,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuItem,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useFolders, useMoveSet } from '../hooks';

interface SetFolderPickerProps {
  setId: string;
  folderId: string | null;
  /** `chip` trên dòng thông tin trang bộ từ, `icon` trên thẻ bộ từ trong danh sách. */
  variant?: 'chip' | 'icon';
  /** Tên bộ từ, để nút biểu tượng có nhãn rõ ràng. */
  setTitle?: string;
}

const NO_FOLDER = '';

/** Chip thư mục trên dòng thông tin bộ từ, bấm để chuyển. Chưa có thư mục nào thì không hiện. */
export function SetFolderPicker({
  setId,
  folderId,
  variant = 'chip',
  setTitle,
}: SetFolderPickerProps) {
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
      {variant === 'icon' ? (
        <MenuTrigger
          disabled={move.isPending}
          aria-label={`Chuyển "${setTitle ?? ''}" vào thư mục, đang ở: ${current?.name ?? 'chưa xếp'}`}
          className="inline-flex size-11 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface hover:text-primary disabled:opacity-50"
        >
          <FolderInput aria-hidden className="size-5" />
        </MenuTrigger>
      ) : (
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
      )}
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
        {current ? (
          <>
            <MenuSeparator />
            <MenuItem onSelect={() => choose(NO_FOLDER)}>
              <FolderMinus aria-hidden className="size-4" />
              Gỡ khỏi thư mục {current.name}
            </MenuItem>
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}
