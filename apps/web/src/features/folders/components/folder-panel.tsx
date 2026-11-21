'use client';

import { NO_FOLDER } from '@vocab/shared';
import {
  Folder,
  FolderMinus,
  FolderOpen,
  FolderPlus,
  Library,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCreateFolder, useFolders } from '../hooks';
import { useFolderDrop } from './folder-dnd';
import { FolderNameDialog } from './folder-name-form';
import { folderHref, FOLDER_PARAM } from './folder-links';
import { FolderSheet } from './folder-sheet';
import { useTranslation } from 'react-i18next';

/** Nhiều thư mục hơn số này thì hiện ô lọc. */
const FILTER_THRESHOLD = 6;

interface FolderLinkProps {
  href: Route;
  label: string;
  count?: number;
  active: boolean;
  Icon: LucideIcon;
  /** Gắn thêm thuộc tính, ví dụ vùng thả khi kéo thả. */
  dropTarget?: string;
}

function FolderLink({ href, label, count, active, Icon, dropTarget }: FolderLinkProps) {
  const { setNodeRef, isOver, isDragging } = useFolderDrop(dropTarget);
  return (
    <li ref={setNodeRef} data-folder-drop={dropTarget}>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-md border px-3 text-small transition-colors duration-fast ease-standard',
          'border-transparent hover:bg-primary-soft',
          active && 'border-primary bg-primary-soft font-semibold text-primary',
          isDragging && dropTarget && 'border-dashed border-primary',
          isOver && 'bg-primary text-primary-fg hover:bg-primary',
        )}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined ? (
          <span className="shrink-0 tabular-nums text-text-muted">{count}</span>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Cột thư mục bên trái trang Bộ từ, giống cây thư mục trên máy tính. Thư mục đang mở nằm trong
 * URL nên danh sách bộ từ và cột này luôn khớp nhau. Dưới 1024 px cột ẩn đi, thay bằng nút mở tấm
 * đáy chọn thư mục (`FolderSheet`, việc 5.34).
 */
export function FolderPanel() {
  const { t } = useTranslation(['sets', 'common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get(FOLDER_PARAM) ?? '';
  const sort = searchParams.get('sort');
  const folders = useFolders();
  const create = useCreateFolder();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('');

  const list = folders.data?.data ?? [];
  const keyword = filter.trim().toLocaleLowerCase('vi');
  const shown = keyword
    ? list.filter(({ name }) => name.toLocaleLowerCase('vi').includes(keyword))
    : list;

  return (
    <>
      <FolderNameDialog
        open={creating}
        onOpenChange={setCreating}
        title={t('folders.create')}
        label={t('folders.newName')}
        submitLabel={t('folders.createSubmit')}
        onSave={async (name) => {
          const folder = await create.mutateAsync(name);
          setCreating(false);
          toast.success(t('folders.created'));
          router.push(folderHref(folder.id, sort));
        }}
      />
      <div className="lg:hidden">
        <FolderSheet
          folders={list}
          current={current}
          sort={sort}
          onCreate={() => setCreating(true)}
        />
      </div>
      <nav
        aria-label={t('folders.title')}
        className="hidden min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:flex lg:self-start"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3">{t('folders.title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('folders.createNew')}
            onClick={() => setCreating(true)}
          >
            <FolderPlus aria-hidden className="size-5" />
          </Button>
        </div>
        {list.length > FILTER_THRESHOLD ? (
          <Input
            type="search"
            aria-label={t('folders.filter')}
            placeholder={t('folders.filter')}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        ) : null}
        <ul className="flex max-h-[calc(100dvh-16rem)] flex-col gap-0.5 overflow-y-auto">
          <FolderLink
            href={folderHref('', sort)}
            label={t('folders.all')}
            active={current === ''}
            Icon={Library}
          />
          <FolderLink
            href={folderHref(NO_FOLDER, sort)}
            label={t('folders.noFolder')}
            active={current === NO_FOLDER}
            Icon={FolderMinus}
            dropTarget={NO_FOLDER}
          />
          {folders.isPending
            ? Array.from({ length: 3 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-11 w-full" />
                </li>
              ))
            : shown.map(({ id, name, setCount }) => (
                <FolderLink
                  key={id}
                  href={folderHref(id, sort)}
                  label={name}
                  count={setCount}
                  active={current === id}
                  Icon={current === id ? FolderOpen : Folder}
                  dropTarget={id}
                />
              ))}
        </ul>
        {folders.isError ? (
          <p role="alert" className="text-small text-danger">
            {t('folders.loadFailed')}{' '}
            <button
              type="button"
              className="min-h-11 font-medium underline underline-offset-4"
              onClick={() => void folders.refetch()}
            >
              {t('common:actions.retry')}
            </button>
          </p>
        ) : null}
        {keyword && shown.length === 0 ? (
          <p className="text-small text-text-muted">{t('folders.noMatch')}</p>
        ) : null}
      </nav>
    </>
  );
}
