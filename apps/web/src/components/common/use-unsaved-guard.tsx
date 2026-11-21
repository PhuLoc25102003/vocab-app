'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import { useTranslation } from 'react-i18next';

const HISTORY_TIMEOUT_MS = 500;

type PendingLeave = { kind: 'link'; target: string } | { kind: 'back' };

function internalTarget(event: MouseEvent): string | null {
  const isPlainClick =
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (!isPlainClick || !(event.target instanceof Element)) {
    return null;
  }
  const anchor = event.target.closest('a[href]');
  if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) {
    return null;
  }
  if (anchor.target && anchor.target !== '_self') {
    return null;
  }
  const url = new URL(anchor.href);
  const samePage = url.pathname === location.pathname && url.search === location.search;
  return url.origin === location.origin && !samePage
    ? `${url.pathname}${url.search}${url.hash}`
    : null;
}

interface UnsavedGuard {
  /** Gỡ chặn, phải gọi trước khi tự chuyển trang sau khi lưu. */
  release: () => Promise<void>;
  /** Hộp thoại hỏi lại, đặt ở bất kỳ đâu trong form. */
  dialog: ReactNode;
}

/**
 * Hỏi lại khi rời form chưa lưu. Chuyển trang trong app (link, nút quay lại) hỏi bằng
 * `ConfirmDialog`. Đóng tab hay tải lại chỉ dùng được hộp thoại của trình duyệt qua
 * `beforeunload`, nội dung do trình duyệt quyết định.
 *
 * App Router không có sự kiện chuyển trang, nên liên kết được chặn từ pha capture, còn nút
 * quay lại được chặn bằng một mục lịch sử phụ. `hasData` được gọi đúng lúc rời trang để form
 * chỉ có thay đổi rỗng (thêm rồi xoá dòng trống) không bị hỏi.
 */
export function useUnsavedGuard(
  isDirty: boolean,
  hasData: () => boolean = () => true,
): UnsavedGuard {
  const router = useRouter();
  const hasGuardEntry = useRef(false);
  const released = useRef(false);
  const hasDataRef = useRef(hasData);
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingLeave | null>(null);

  useEffect(() => {
    hasDataRef.current = hasData;
  }, [hasData]);

  const removeGuardEntry = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (!hasGuardEntry.current) {
          resolve();
          return;
        }
        hasGuardEntry.current = false;
        const timeout = window.setTimeout(resolve, HISTORY_TIMEOUT_MS);
        window.addEventListener(
          'popstate',
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        window.history.back();
      }),
    [],
  );

  const release = useCallback(async () => {
    released.current = true;
    await removeGuardEntry();
  }, [removeGuardEntry]);

  useEffect(() => {
    if (!isDirty) {
      void removeGuardEntry();
      return;
    }
    released.current = false;
    if (!hasGuardEntry.current) {
      window.history.pushState(null, '', location.href);
      hasGuardEntry.current = true;
    }

    const shouldAsk = () => !released.current && hasDataRef.current();
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldAsk()) {
        event.preventDefault();
      }
    };
    const guardLink = (event: MouseEvent) => {
      const target = internalTarget(event);
      if (!target || released.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (shouldAsk()) {
        setPending({ kind: 'link', target });
      } else {
        void release().then(() => router.push(target as Route));
      }
    };
    const guardBack = () => {
      if (released.current) {
        return;
      }
      if (!shouldAsk()) {
        // Mục phụ đã bị lấy ra, lùi thêm một bước để thật sự quay lại.
        hasGuardEntry.current = false;
        released.current = true;
        window.history.back();
        return;
      }
      // Giữ người dùng ở lại trang trong lúc hỏi: đặt lại mục phụ vừa bị lấy ra.
      window.history.pushState(null, '', location.href);
      setPending({ kind: 'back' });
    };

    window.addEventListener('beforeunload', warnBeforeUnload);
    window.addEventListener('click', guardLink, true);
    window.addEventListener('popstate', guardBack);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      window.removeEventListener('click', guardLink, true);
      window.removeEventListener('popstate', guardBack);
    };
  }, [isDirty, release, removeGuardEntry, router]);

  // Trang bị ẩn hoặc gỡ thì mục lịch sử cũ không còn thuộc về form này.
  useEffect(
    () => () => {
      hasGuardEntry.current = false;
    },
    [],
  );

  const leave = () => {
    const current = pending;
    setPending(null);
    if (current?.kind === 'link') {
      void release().then(() => router.push(current.target as Route));
    } else if (current?.kind === 'back') {
      // Bỏ mục phụ vừa đặt lại và trang hiện tại.
      released.current = true;
      hasGuardEntry.current = false;
      window.history.go(-2);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title={t('unsaved.title')}
      description={t('unsaved.description')}
      confirmLabel={t('unsaved.leave')}
      cancelLabel={t('unsaved.stay')}
      onConfirm={leave}
    />
  );

  return { release, dialog };
}
