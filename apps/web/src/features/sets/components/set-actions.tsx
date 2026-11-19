'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formErrorMessage } from '@/lib/form-errors';
import { useDeleteSet, useDuplicateSet } from '../hooks/use-set';

export function SetOwnerActions({ id }: { id: string }) {
  const router = useRouter();
  const deleteSet = useDeleteSet(id);
  const [isConfirming, setIsConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  // Nút vừa bấm biến mất, nên phải chuyển focus để người dùng bàn phím không bị mất chỗ.
  const toggleConfirm = (next: boolean) => {
    setIsConfirming(next);
    requestAnimationFrame(() => (next ? keepRef : deleteRef).current?.focus());
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
        <Link href={`/sets/${id}/edit` as Route}>Sửa bộ từ</Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href={`/sets/import?setId=${id}` as Route}>Nhập thêm thẻ</Link>
      </Button>
      <Button ref={deleteRef} variant="secondary" onClick={() => toggleConfirm(true)}>
        Xoá bộ từ
      </Button>
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
