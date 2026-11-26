'use client';

import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { Check, ChevronRight } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const ITEM_CLASS =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-body outline-none data-highlighted:bg-primary-soft data-disabled:cursor-default data-disabled:opacity-50';

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

/** Menu chuột phải nổi: kính Liquid Glass bo góc giọt nước, phồng ra từ điểm bấm. */
export function ContextMenuContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        collisionPadding={16}
        className={cn(
          'glass-overlay glass-pop z-50 max-h-(--radix-context-menu-content-available-height) min-w-56 origin-(--radix-context-menu-content-transform-origin) overflow-y-auto rounded-menu p-1.5',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger>) {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(ITEM_CLASS, 'justify-between data-[state=open]:bg-primary-soft', className)}
      {...props}
    >
      <span className="flex items-center gap-3">{children}</span>
      <ChevronRight aria-hidden className="size-4 text-text-muted" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

export function ContextMenuSubContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        collisionPadding={16}
        className={cn(
          'glass-overlay glass-pop z-50 max-h-(--radix-context-menu-content-available-height) min-w-56 origin-(--radix-context-menu-content-transform-origin) overflow-y-auto rounded-menu p-1.5',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

interface ContextMenuItemProps extends ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> {
  /** Hành động xoá hoặc không hoàn tác được. */
  danger?: boolean;
}

export function ContextMenuItem({ className, danger = false, ...props }: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(ITEM_CLASS, danger && 'text-danger', className)}
      {...props}
    />
  );
}

export function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(ITEM_CLASS, 'relative pr-10', className)}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ContextMenuPrimitive.ItemIndicator className="absolute right-3">
        <Check aria-hidden className="size-4 text-primary" />
      </ContextMenuPrimitive.ItemIndicator>
    </ContextMenuPrimitive.RadioItem>
  );
}

export function ContextMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>) {
  return (
    <ContextMenuPrimitive.Label
      className={cn('px-3 py-2 text-small text-text-muted', className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator() {
  return <ContextMenuPrimitive.Separator className="mx-2 my-1 h-px bg-border" />;
}
