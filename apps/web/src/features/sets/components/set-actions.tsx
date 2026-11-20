'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SetDetail } from '@vocab/shared';
import { FileUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useDeleteSet, useDuplicateSet } from '../hooks/use-set';
import { OfflineMenuItem } from './offline-toggle';

/** Một nút chính để sửa, các thao tác còn lại gom vào menu cho header gọn. */
export function SetOwnerActions({ set }: { set: SetDetail }) {
  const { id } = set;
  const router = useRouter();
  const deleteSet = useDeleteSet(id);
  const [isConfirming, setIsConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  // Nút vừa bấm biến mất, nên phải chuyển focus để người dùng bàn phím không bị mất chỗ.
  const toggleConfirm = (next: boolean) => {
    setIsConfirming(next);
    requestAnimationFrame(() => (next ? keepRef : menuRef).current?.focus());
  };

  const confirmDelete = () => {
    deleteSet.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã xoá bộ từ');
        router.push('/sets');
      },
      onError: (error) => toast.error(formErrorMessage(error)),
    });
  };

  if (isConfirming) {
    return (
      <div role="group" aria-label="Xác nhận xoá" className="flex flex-wrap items-center gap-2">
        <p className="text-small">Xoá bộ từ này? Bạn sẽ không khôi phục được.</p>
        <Button
          variant="secondary"
          className="text-danger"
          loading={deleteSet.isPending}
          onClick={confirmDelete}
        >
          Xoá bộ từ
        </Button>
        <Button
          ref={keepRef}
          variant="ghost"
          disabled={deleteSet.isPending}
          onClick={() => toggleConfirm(false)}
        >
          Giữ lại
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button asChild variant="secondary">
        <Link href={`/sets/${id}/edit` as Route}>
          <Pencil aria-hidden className="size-4" />
          Sửa bộ từ
        </Link>
      </Button>
      <Menu>
        <MenuTrigger asChild>
          <Button ref={menuRef} variant="secondary" aria-label="Thao tác khác" className="px-3">
            <MoreHorizontal aria-hidden className="size-5" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild>
            <Link href={`/sets/import?setId=${id}` as Route}>
              <FileUp aria-hidden className="size-4" />
              Nhập thêm thẻ
            </Link>
          </MenuItem>
          <OfflineMenuItem set={set} />
          <MenuSeparator />
          {/* Đợi menu đóng xong rồi mới chuyển focus sang nút xác nhận. */}
          <MenuItem danger onSelect={() => setTimeout(() => toggleConfirm(true))}>
            <Trash2 aria-hidden className="size-4" />
            Xoá bộ từ
          </MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}

export function DuplicateSetButton({ id }: { id: string }) {
  const router = useRouter();
  const duplicateSet = useDuplicateSet(id);

  const duplicate = () => {
    duplicateSet.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success('Đã sao chép bộ từ');
        router.push(`/sets/${copy.id}` as Route);
      },
      onError: (error) => toast.error(formErrorMessage(error)),
    });
  };

  return (
    <Button variant="secondary" loading={duplicateSet.isPending} onClick={duplicate}>
      Sao chép bộ từ
    </Button>
  );
}
