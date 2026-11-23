'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataTableColumnDef {
  key?: string;
  label: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableContainerProps {
  minWidth?: string;
  className?: string;
  children: ReactNode;
}

/** Khung bọc danh sách dạng bảng, hỗ trợ cuộn ngang an toàn khi màn hình hẹp */
export function DataTableContainer({
  minWidth = 'min-w-[700px]',
  className,
  children,
}: DataTableContainerProps) {
  return (
    <div className="overflow-x-auto">
      <div className={cn('flex flex-col', minWidth, className)}>{children}</div>
    </div>
  );
}

export interface DataTableHeaderProps {
  columns?: DataTableColumnDef[];
  gridTemplateColumns?: string;
  gridColsClass?: string;
  className?: string;
  children?: ReactNode;
}

/** Dòng tiêu đề cột chuẩn của bảng dữ liệu quản trị */
export function DataTableHeader({
  columns,
  gridTemplateColumns,
  gridColsClass,
  className,
  children,
}: DataTableHeaderProps) {
  const style: CSSProperties | undefined = gridTemplateColumns
    ? { gridTemplateColumns }
    : undefined;

  return (
    <div
      role="row"
      style={style}
      className={cn(
        'sticky top-0 z-10 bg-surface grid items-center gap-4 border-b border-border px-3 py-2.5 text-tiny font-semibold uppercase tracking-wider text-text-muted select-none',
        gridColsClass,
        className,
      )}
    >
      {columns
        ? columns.map((col, index) => (
            <div
              key={col.key ?? index}
              role="columnheader"
              className={cn(
                'whitespace-nowrap',
                col.align === 'center' && 'text-center',
                col.align === 'right' && 'text-right',
                col.align !== 'center' && col.align !== 'right' && 'text-left',
                col.className,
              )}
            >
              {col.label}
            </div>
          ))
        : children}
    </div>
  );
}

export interface DataTableRowProps {
  as?: 'li' | 'div';
  gridTemplateColumns?: string;
  gridColsClass?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/** Dòng dữ liệu chuẩn trong bảng */
export function DataTableRow({
  as: Component = 'li',
  gridTemplateColumns,
  gridColsClass,
  className,
  children,
  onClick,
}: DataTableRowProps) {
  const style: CSSProperties | undefined = gridTemplateColumns
    ? { gridTemplateColumns }
    : undefined;

  return (
    <Component
      style={style}
      onClick={onClick}
      className={cn(
        'grid items-center gap-4 border-b border-border px-3 py-3 last:border-b-0 hover:bg-surface-elevated/20 transition-colors',
        gridColsClass,
        className,
      )}
    >
      {children}
    </Component>
  );
}

export interface DataTableCellProps {
  align?: 'left' | 'center' | 'right';
  className?: string;
  children: ReactNode;
}

/** Ô dữ liệu trong hàng bảng */
export function DataTableCell({ align = 'left', className, children }: DataTableCellProps) {
  return (
    <div
      className={cn(
        'min-w-0',
        align === 'center' && 'text-center',
        align === 'right' && 'flex justify-end text-right',
        align !== 'center' && align !== 'right' && 'text-left',
        className,
      )}
    >
      {children}
    </div>
  );
}
