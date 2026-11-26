'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const ITEM_CLASS =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-body outline-none data-highlighted:bg-primary-soft data-disabled:cursor-default data-disabled:opacity-50';

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuRadioGroup = DropdownMenu.RadioGroup;
export const MenuSub = DropdownMenu.Sub;

/** Danh sách nổi của menu: kính Liquid Glass bo góc giọt nước, phồng ra từ nút bấm. */
export function MenuContent({
  className,
  align = 'end',
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={8}
        collisionPadding={16}
        className={cn(
          'glass-overlay glass-pop z-40 max-h-(--radix-dropdown-menu-content-available-height) min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto rounded-menu p-1.5',
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function MenuSubTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.SubTrigger>) {
  return (
    <DropdownMenu.SubTrigger
      className={cn(ITEM_CLASS, 'justify-between data-[state=open]:bg-primary-soft', className)}
      {...props}
    >
      <span className="flex items-center gap-3">{children}</span>
      <ChevronRight aria-hidden className="size-4 text-text-muted" />
    </DropdownMenu.SubTrigger>
  );
}

export function MenuSubContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.SubContent>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.SubContent
        sideOffset={8}
        collisionPadding={16}
        className={cn(
          'glass-overlay glass-pop z-40 max-h-(--radix-dropdown-menu-content-available-height) min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto rounded-menu p-1.5',
          className,
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

interface MenuItemProps extends ComponentPropsWithoutRef<typeof DropdownMenu.Item> {
  /** Hành động xoá hoặc không hoàn tác được. */
  danger?: boolean;
}

export function MenuItem({ className, danger = false, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item className={cn(ITEM_CLASS, danger && 'text-danger', className)} {...props} />
  );
}

/** Mục chọn một trong nhiều, mục đang chọn có dấu tích. */
export function MenuRadioItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.RadioItem>) {
  return (
    <DropdownMenu.RadioItem className={cn(ITEM_CLASS, 'relative pr-10', className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <DropdownMenu.ItemIndicator className="absolute right-3">
        <Check aria-hidden className="size-4 text-primary" />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.RadioItem>
  );
}

export function MenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn('px-3 py-2 text-small text-text-muted', className)}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="mx-2 my-1 h-px bg-border" />;
}
