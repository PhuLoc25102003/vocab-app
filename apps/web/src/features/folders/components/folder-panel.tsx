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
import { FolderNameForm } from './folder-name-form';
import { folderHref, FOLDER_PARAM } from './folder-links';

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
  return (
    <li className="shrink-0 lg:shrink" data-folder-drop={dropTarget}>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-md border px-3 text-small transition-colors duration-fast ease-standard',
          'border-border bg-surface hover:bg-primary-soft lg:border-transparent lg:bg-transparent',
          active && 'border-primary bg-primary-soft font-semibold text-primary lg:border-primary',
        )}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 max-w-40 truncate lg:max-w-none lg:flex-1">{label}</span>
        {count !== undefined ? (
          <span className="shrink-0 tabular-nums text-text-muted">{count}</span>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Cột thư mục bên trái trang Bộ từ, giống cây thư mục trên máy tính. Thư mục đang mở nằm trong
 * URL nên danh sách bộ từ và cột này luôn khớp nhau. Ở màn hình hẹp cột thành hàng chip cuộn ngang.
 */
export function FolderPanel() {
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
    <nav
      aria-label="Thư mục"
      className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:self-start"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h3">Thư mục</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Tạo thư mục mới"
          aria-expanded={creating}
          onClick={() => setCreating((open) => !open)}
        >
          <FolderPlus aria-hidden className="size-5" />
        </Button>
      </div>
      {creating ? (
        <FolderNameForm
          label="Tên thư mục mới"
          submitLabel="Tạo"
          onCancel={() => setCreating(false)}
          onSave={async (name) => {
            const folder = await create.mutateAsync(name);
            setCreating(false);
            toast.success('Đã tạo thư mục');
            router.push(folderHref(folder.id, sort));
          }}
        />
      ) : null}
      {list.length > FILTER_THRESHOLD ? (
        <Input
          type="search"
          aria-label="Lọc thư mục"
          placeholder="Lọc thư mục"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      ) : null}
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:max-h-[calc(100dvh-16rem)] lg:flex-col lg:gap-0.5 lg:overflow-x-visible lg:overflow-y-auto">
        <FolderLink
          href={folderHref('', sort)}
          label="Tất cả bộ từ"
          active={current === ''}
          Icon={Library}
        />
        <FolderLink
          href={folderHref(NO_FOLDER, sort)}
          label="Chưa xếp thư mục"
          active={current === NO_FOLDER}
          Icon={FolderMinus}
          dropTarget={NO_FOLDER}
        />
        {folders.isPending
          ? Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="shrink-0 lg:shrink">
                <Skeleton className="h-11 w-32 lg:w-full" />
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
          Không tải được thư mục.{' '}
          <button
            type="button"
            className="min-h-11 font-medium underline underline-offset-4"
            onClick={() => void folders.refetch()}
          >
            Thử lại
          </button>
        </p>
      ) : null}
      {keyword && shown.length === 0 ? (
        <p className="text-small text-text-muted">Không có thư mục nào khớp.</p>
      ) : null}
    </nav>
  );
}
