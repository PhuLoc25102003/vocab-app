'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

const LEAVE_MESSAGE = 'Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?';
const HISTORY_TIMEOUT_MS = 500;

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

/**
 * Hỏi lại khi rời form chưa lưu. App Router không có sự kiện chuyển trang, nên liên kết
 * được chặn từ pha capture, còn nút quay lại được chặn bằng một mục lịch sử phụ.
 * Trả về hàm gỡ chặn, phải gọi trước khi tự chuyển trang sau khi lưu.
 */
export function useUnsavedGuard(isDirty: boolean): () => Promise<void> {
  const router = useRouter();
  const hasGuardEntry = useRef(false);
  const released = useRef(false);

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

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!released.current) {
        event.preventDefault();
      }
    };
    const guardLink = (event: MouseEvent) => {
      const target = released.current ? null : internalTarget(event);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm(LEAVE_MESSAGE)) {
        void release().then(() => router.push(target as Route));
      }
    };
    const guardBack = () => {
      if (released.current) {
        return;
      }
      hasGuardEntry.current = false;
      if (window.confirm(LEAVE_MESSAGE)) {
        released.current = true;
        window.history.back();
      } else {
        window.history.pushState(null, '', location.href);
        hasGuardEntry.current = true;
      }
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

  return release;
}
