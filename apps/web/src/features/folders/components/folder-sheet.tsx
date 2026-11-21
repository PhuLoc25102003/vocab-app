'use client';

import { NO_FOLDER, type Folder as FolderItem } from '@vocab/shared';
import { Check, ChevronDown, Folder, FolderMinus, FolderPlus, Library, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { folderHref } from './folder-links';

function SheetLink({
  href,
  label,
  count,
  active,
  icon: Icon,
  onPick,
}: {
  href: Route;
  label: string;
  count?: number;
  active: boolean;
  icon: typeof Folder;
  onPick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onPick}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-12 items-center gap-3 rounded-md px-3 transition-colors duration-fast ease-standard hover:bg-primary-soft',
          active && 'bg-primary-soft font-semibold text-primary',
        )}
      >
        <Icon aria-hidden className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 wrap-anywhere">{label}</span>
        {count !== undefined ? (
          <span className="shrink-0 tabular-nums text-text-muted">{count}</span>
        ) : null}
        {active ? <Check aria-hidden className="size-5 shrink-0" /> : null}
      </Link>
    </li>
  );
}

/**
 * Chọn thư mục trên màn hình hẹp (việc 5.34): một nút "Thư mục: <tên>" mở tấm đáy có ô tìm,
 * danh sách thư mục không bị cắt chữ và nút tạo thư mục, thay cho hàng chip cuộn ngang.
 */
export function FolderSheet({
  folders,
  current,
  sort,
  onCreate,
}: {
  folders: FolderItem[];
  current: string;
  sort: string | null;
  onCreate: () => void;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const close = () => {
    setOpen(false);
    setFilter('');
  };

  let currentName = 'Tất cả bộ từ';
  if (current === NO_FOLDER) currentName = 'Chưa xếp thư mục';
  else if (current) currentName = folders.find(({ id }) => id === current)?.name ?? 'Thư mục';
  const keyword = filter.trim().toLocaleLowerCase('vi');
  const shown = keyword
    ? folders.filter(({ name }) => name.toLocaleLowerCase('vi').includes(keyword))
    : folders;

  return (
    <>
      <Button
        variant="secondary"
        className="w-full justify-between"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Folder aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="truncate">Thư mục: {currentName}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-text-muted" />
      </Button>
      <Dialog open={open} onRequestClose={close} labelledBy={titleId} layout="sheet">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id={titleId} className="text-h3">
              Chọn thư mục
            </h2>
            <Button variant="ghost" size="icon" aria-label="Đóng" onClick={close}>
              <X aria-hidden className="size-5" />
            </Button>
          </div>
          <Input
            type="search"
            aria-label="Tìm thư mục"
            placeholder="Tìm thư mục"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <ul
            aria-label="Danh sách thư mục"
            className="flex max-h-[50dvh] flex-col overflow-y-auto"
          >
            {keyword ? null : (
              <>
                <SheetLink
                  href={folderHref('', sort)}
                  label="Tất cả bộ từ"
                  active={current === ''}
                  icon={Library}
                  onPick={close}
                />
                <SheetLink
                  href={folderHref(NO_FOLDER, sort)}
                  label="Chưa xếp thư mục"
                  active={current === NO_FOLDER}
                  icon={FolderMinus}
                  onPick={close}
                />
              </>
            )}
            {shown.map(({ id, name, setCount }) => (
              <SheetLink
                key={id}
                href={folderHref(id, sort)}
                label={name}
                count={setCount}
                active={current === id}
                icon={Folder}
                onPick={close}
              />
            ))}
          </ul>
          {keyword && shown.length === 0 ? (
            <p className="text-small text-text-muted">Không có thư mục nào khớp.</p>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              close();
              onCreate();
            }}
          >
            <FolderPlus aria-hidden className="size-4" />
            Tạo thư mục
          </Button>
        </div>
      </Dialog>
    </>
  );
}
