'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { can } from '../permissions';
import { signOut } from '../session';
import { useAuthStore } from '../store';
import { useTranslation } from 'react-i18next';

const ITEM_CLASS =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-body outline-none data-highlighted:bg-primary-soft data-disabled:opacity-50';

/**
 * Rút gọn tên hiển thị trên thanh điều hướng nếu tên dài (từ 3 từ trở lên),
 * chỉ lấy tên đệm/tên lót và tên chính (2 từ cuối, ví dụ "Đặng Phú Lộc" -> "Phú Lộc")
 * để tránh tràn hoặc đẩy layout thanh điều hướng.
 */
export function formatShortName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 2) {
    return parts.slice(-2).join(' ');
  }
  return trimmed;
}

/** Ảnh đại diện kèm tên hiển thị, mở menu tài khoản. Tên ẩn trên màn hình hẹp. */
export function AccountMenu() {
  const { t } = useTranslation('account');
  const user = useAuthStore((state) => state.user);
  // Nhớ phiên lúc bấm Đăng xuất. Header không bị huỷ khi chuyển trang, nên đăng nhập lại
  // (store có đối tượng user mới) phải tự hết trạng thái "Đang đăng xuất".
  const [leavingUser, setLeavingUser] = useState<typeof user>(null);
  const leaving = user !== null && leavingUser === user;
  const name = user?.displayName ?? t('title');
  const shortName = formatShortName(name);
  const initial = name.trim().charAt(0).toLocaleUpperCase('vi') || '?';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="glass-button-ghost flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-full px-1 sm:pr-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-small font-semibold text-primary-fg"
        >
          {initial}
        </span>
        {/* Tên đọc được là "Tài khoản: <tên>", phần chữ hiện trên nút nằm trong đó. */}
        <span className="sr-only">{t('menuLabel')}</span>
        <span className="sr-only text-small font-medium lg:not-sr-only lg:max-w-20 lg:truncate lg:whitespace-nowrap xl:max-w-28">
          {shortName}
        </span>
        <ChevronDown aria-hidden className="hidden size-4 shrink-0 text-text-muted lg:inline" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="glass-overlay glass-pop z-40 min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) rounded-menu p-1.5"
        >
          {user ? (
            <div className="mx-1.5 mb-1 border-b border-border px-1.5 pt-1.5 pb-2.5">
              <p className="truncate font-medium">{user.displayName}</p>
              <p className="truncate text-small text-text-muted">{user.email}</p>
            </div>
          ) : null}
          <DropdownMenu.Item asChild className={ITEM_CLASS}>
            <Link href="/account">
              <UserRound aria-hidden className="size-4" />
              {t('title')}
            </Link>
          </DropdownMenu.Item>
          {can(user, 'manage-users') ? (
            <DropdownMenu.Item asChild className={ITEM_CLASS}>
              <Link href="/admin/users">
                <ShieldCheck aria-hidden className="size-4" />
                {t('manageUsers')}
              </Link>
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Separator className="mx-2 my-1 h-px bg-border" />
          <DropdownMenu.Item
            className={ITEM_CLASS}
            disabled={leaving}
            onSelect={() => {
              setLeavingUser(user);
              void signOut();
            }}
          >
            <LogOut aria-hidden className="size-4" />
            {t(leaving ? 'loggingOut' : 'logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
