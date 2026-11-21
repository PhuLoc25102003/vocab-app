'use client';

import { NO_FOLDER } from '@vocab/shared';
import { ChevronRight, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { formErrorMessage } from '@/lib/form-errors';
import { useDeleteFolder, useFolders, useRenameFolder } from '../hooks';
import { folderHref, FOLDER_PARAM } from './folder-links';
import { FolderNameDialog } from './folder-name-form';
import { useTranslation } from 'react-i18next';

/** Đường dẫn "Bộ từ / tên thư mục" khi đang mở một thư mục, kèm đổi tên, xoá và đóng thư mục. */
export function FolderHeader() {
  const { t } = useTranslation('sets');
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get(FOLDER_PARAM) ?? '';
  const sort = searchParams.get('sort');
  const folders = useFolders();
  const rename = useRenameFolder();
  const remove = useDeleteFolder();
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!current) {
    return null;
  }
  const folder = folders.data?.data.find(({ id }) => id === current);
  const name = current === NO_FOLDER ? t('folders.noFolder') : folder?.name;
  if (!name) {
    return null;
  }
  const closeHref = folderHref('', sort);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-2">
      <nav aria-label={t('folders.breadcrumb')} className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-body">
          <li>
            <Link
              href={closeHref}
              className="inline-flex min-h-11 items-center text-text-muted underline-offset-4 hover:underline"
            >
              {t('folders.sets')}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4 text-text-muted" />
          </li>
          <li aria-current="page" className="min-w-0 truncate font-semibold">
            {name}
            {folder ? (
              <span className="ml-2 font-normal text-small text-text-muted tabular-nums">
                {t('folders.setCount', { count: folder.setCount })}
              </span>
            ) : null}
          </li>
        </ol>
      </nav>
      <div className="flex items-center gap-1">
        {folder ? (
          <Menu>
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('folders.actionsFor', { name: folder.name })}
              >
                <MoreHorizontal aria-hidden className="size-5" />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => setTimeout(() => setRenaming(true))}>
                <Pencil aria-hidden className="size-4" />
                {t('folders.rename')}
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                danger
                onSelect={() =>
                  setTimeout(() => {
                    setError(null);
                    setConfirming(true);
                  })
                }
              >
                <Trash2 aria-hidden className="size-4" />
                {t('folders.delete')}
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : null}
        <Button asChild variant="ghost" size="icon">
          <Link href={closeHref} aria-label={t('folders.close')}>
            <X aria-hidden className="size-5" />
          </Link>
        </Button>
      </div>
      {folder ? (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={t('folders.deleteTitle', { name: folder.name })}
          description={t('folders.deleteDescription', { count: folder.setCount })}
          confirmLabel={t('folders.delete')}
          pending={remove.isPending}
          error={error}
          onConfirm={() =>
            remove.mutate(folder.id, {
              onSuccess: () => {
                setConfirming(false);
                toast.success(t('folders.deleted'));
                router.push(closeHref);
              },
              onError: (reason) => setError(formErrorMessage(reason)),
            })
          }
        />
      ) : null}
      {folder ? (
        <FolderNameDialog
          open={renaming}
          onOpenChange={setRenaming}
          title={t('folders.rename')}
          label={t('folders.name')}
          submitLabel={t('folders.save')}
          defaultName={folder.name}
          onSave={async (next) => {
            await rename.mutateAsync({ id: folder.id, name: next });
            setRenaming(false);
            toast.success(t('folders.renamed'));
          }}
        />
      ) : null}
    </div>
  );
}
