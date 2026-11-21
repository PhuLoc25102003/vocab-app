'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SetDetail } from '@vocab/shared';
import { FileUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useDeleteSet, useDuplicateSet } from '../hooks/use-set';
import { useOfflineMenu } from './offline-toggle';
import { useTranslation } from 'react-i18next';

/** Một nút chính để sửa, các thao tác còn lại gom vào menu cho header gọn. */
export function SetOwnerActions({ set }: { set: SetDetail }) {
  const { t } = useTranslation('sets');
  const { id, title } = set;
  const router = useRouter();
  const deleteSet = useDeleteSet(id);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offline = useOfflineMenu(set);

  const openConfirm = () => {
    setError(null);
    setConfirming(true);
  };

  const confirmDelete = () => {
    setError(null);
    deleteSet.mutate(undefined, {
      onSuccess: () => {
        setConfirming(false);
        toast.success(t('actions.deleted'));
        router.push('/sets');
      },
      onError: (reason) => setError(formErrorMessage(reason)),
    });
  };

  return (
    <>
      <Button asChild variant="secondary">
        <Link href={`/sets/${id}/edit` as Route}>
          <Pencil aria-hidden className="size-4" />
          {t('actions.edit')}
        </Link>
      </Button>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="secondary" aria-label={t('actions.more')} className="px-3">
            <MoreHorizontal aria-hidden className="size-5" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild>
            <Link href={`/sets/import?setId=${id}` as Route}>
              <FileUp aria-hidden className="size-4" />
              {t('actions.importMore')}
            </Link>
          </MenuItem>
          {offline.item}
          <MenuSeparator />
          {/* Đợi menu đóng và trả focus về nút ba chấm, hộp thoại đóng sẽ trả focus về đó. */}
          <MenuItem danger onSelect={() => setTimeout(openConfirm)}>
            <Trash2 aria-hidden className="size-4" />
            {t('actions.delete')}
          </MenuItem>
        </MenuContent>
      </Menu>
      {offline.dialog}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('actions.deleteTitle', { title })}
        description={t('actions.deleteDescription')}
        confirmLabel={t('actions.delete')}
        pending={deleteSet.isPending}
        error={error}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export function DuplicateSetButton({ id }: { id: string }) {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const duplicateSet = useDuplicateSet(id);

  const duplicate = () => {
    duplicateSet.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success(t('actions.copied'));
        router.push(`/sets/${copy.id}` as Route);
      },
      onError: (error) => toast.error(formErrorMessage(error)),
    });
  };

  return (
    <Button variant="secondary" loading={duplicateSet.isPending} onClick={duplicate}>
      {t('actions.copy')}
    </Button>
  );
}
