'use client';

import { Search } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useId, useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Pagination } from '@/components/common/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const formatNum = (count: number, locale = 'vi') =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN').format(count);

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
  /** Tuỳ chỉnh class cho vùng thân danh sách. */
  bodyClassName?: string;
  children: ReactNode;
}

export function ListPanel({
  title,
  count,
  actions,
  toolbar,
  footer,
  bodyClassName,
  children,
}: ListPanelProps) {
  const { i18n } = useTranslation();
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
                {formatNum(count, i18n.language)}
              </span>
            ) : null}
          </h2>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {toolbar}
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-col px-4 pt-0 pb-2 min-h-[260px] max-h-[calc(100dvh-280px)] overflow-y-auto',
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </section>
  );
}

export interface ListTab {
  key?: string;
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
  const { t, i18n } = useTranslation();
  const [prevSearchValue, setPrevSearchValue] = useState(search?.value ?? '');
  const [draft, setDraft] = useState(search?.value ?? '');

  if ((search?.value ?? '') !== prevSearchValue) {
    setPrevSearchValue(search?.value ?? '');
    setDraft(search?.value ?? '');
  }

  useEffect(() => {
    if (!search) return;
    const trimmed = draft.trim();
    if (trimmed === (search.value ?? '')) return;
    const timer = setTimeout(() => {
      search.onSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, search]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    search?.onSearch(draft.trim());
  };
  return (
    <div className="flex flex-col gap-3">
      {tabs ? (
        <nav
          aria-label={t('list.statusFilter')}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.key ?? `${tab.label}-${tab.href}`}
              href={tab.href}
              aria-current={tab.current ? 'page' : undefined}
              className="inline-flex min-h-11 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-md px-3 text-small font-medium text-text-muted transition-colors duration-fast ease-standard hover:bg-primary-soft aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
            >
              {tab.label}
              {tab.count !== undefined ? ' ' : null}
              {tab.count !== undefined ? (
                <span className="tabular-nums">({formatNum(tab.count, i18n.language)})</span>
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
                className="pl-9 w-full"
              />
            </form>
          ) : null}
          {filters ? (
            <div className="flex flex-wrap gap-2 sm:flex-nowrap shrink-0">{filters}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Bề rộng cố định cho một ô lọc hoặc sắp xếp trong `ListToolbar`. */
export function ListFilter({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0 flex-1 sm:flex-none', wide ? 'sm:w-56' : 'sm:w-48')}>
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
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor?: (page: number) => Route;
  onPageChange?: (page: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pageCount = Math.ceil(total / pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-small text-text-muted tabular-nums">
        {t('list.range', { from, to, total: formatNum(total, i18n.language) })}
      </p>
      {pageCount > 1 ? (
        hrefFor ? (
          <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
        ) : onPageChange ? (
          <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
        ) : null
      ) : null}
    </div>
  );
}

/** Đang lọc mà không có kết quả: nói rõ và cho xoá bộ lọc. */
export function ListNoMatch({
  text,
  clearHref,
  onClear,
}: {
  text: string;
  clearHref?: Route;
  onClear?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <p className="text-text-muted">{text}</p>
      {onClear ? (
        <Button variant="secondary" onClick={onClear}>
          {t('actions.clearFilters')}
        </Button>
      ) : clearHref ? (
        <Button asChild variant="secondary">
          <Link href={clearHref}>{t('actions.clearFilters')}</Link>
        </Button>
      ) : null}
    </div>
  );
}
