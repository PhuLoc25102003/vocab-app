'use client';

import { Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const number = new Intl.NumberFormat('vi-VN');

interface ListPanelProps {
  title: string;
  /** Tổng số mục khớp bộ lọc, hiện cạnh tiêu đề. */
  count?: number;
  /** Nút hành động ở đầu khung, ví dụ "Tạo lớp". */
  actions?: ReactNode;
  /** Thường là `ListToolbar`. */
  toolbar?: ReactNode;
  /** Thường là `ListPager`. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Khung dùng chung cho mọi danh sách có thể dài (việc 5.29): viền, tiêu đề kèm tổng số, hàng
 * công cụ, thân và chân phân trang. Bốn trạng thái của danh sách nằm trong thân khung.
 */
export function ListPanel({ title, count, actions, toolbar, footer, children }: ListPanelProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col rounded-lg border border-border-strong bg-surface"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={titleId} className="text-h3">
            {title}
            {count !== undefined ? (
              <span className="ml-2 text-body font-normal text-text-muted tabular-nums">
                {number.format(count)}
              </span>
            ) : null}
          </h2>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {toolbar}
      </div>
      <div className="flex min-w-0 flex-col px-4 py-2">{children}</div>
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </section>
  );
}

export interface ListTab {
  label: string;
  href: Route;
  current: boolean;
  count?: number;
}

interface ListToolbarProps {
  /** Tab trạng thái, mỗi tab là một link để bộ lọc nằm trong URL. */
  tabs?: ListTab[];
  search?: {
    label: string;
    value: string;
    onSearch: (value: string) => void;
  };
  /** Ô lọc và sắp xếp; mỗi ô nên bọc trong `ListFilter` để có bề rộng cố định. */
  filters?: ReactNode;
}

export function ListToolbar({ tabs, search, filters }: ListToolbarProps) {
  const [draft, setDraft] = useState(search?.value ?? '');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    search?.onSearch(draft.trim());
  };
  return (
    <div className="flex flex-col gap-3">
      {tabs ? (
        <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.current ? 'page' : undefined}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-small font-medium text-text-muted transition-colors duration-fast ease-standard hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
            >
              {tab.label}
              {tab.count !== undefined ? ' ' : null}
              {tab.count !== undefined ? (
                <span className="tabular-nums">({number.format(tab.count)})</span>
              ) : null}
            </Link>
          ))}
        </nav>
      ) : null}
      {search || filters ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {search ? (
            <form role="search" onSubmit={submit} className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
              />
              <Input
                type="search"
                aria-label={search.label}
                placeholder={search.label}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="pl-9"
              />
            </form>
          ) : null}
          {filters ? <div className="flex flex-wrap gap-2 sm:flex-nowrap">{filters}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Bề rộng cố định cho một ô lọc hoặc sắp xếp trong `ListToolbar`. */
export function ListFilter({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0 flex-1 sm:flex-none', wide ? 'sm:w-56' : 'sm:w-44')}>
      {children}
    </div>
  );
}

/** Chân khung: "1–20 trên 128" và phân trang. */
export function ListPager({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => Route;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pageCount = Math.ceil(total / pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-small text-text-muted tabular-nums">
        {from}–{to} trên {number.format(total)}
      </p>
      {pageCount > 1 ? <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} /> : null}
    </div>
  );
}

/** Đang lọc mà không có kết quả: nói rõ và cho xoá bộ lọc. */
export function ListNoMatch({ text, clearHref }: { text: string; clearHref: Route }) {
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <p className="text-text-muted">{text}</p>
      <Button asChild variant="secondary">
        <Link href={clearHref}>Xoá bộ lọc</Link>
      </Button>
    </div>
  );
}
