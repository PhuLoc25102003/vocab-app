'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  /** Người dùng muốn đóng bằng Esc hoặc bấm nền. Nơi dùng quyết định có đóng hay không. */
  onRequestClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** Phần tử nhận focus khi mở. Không có thì trình duyệt chọn phần tử đầu tiên bấm được. */
  initialFocus?: RefObject<HTMLElement | null> | (() => HTMLElement | null);
  /**
   * `sheet`: dưới 640 px là tấm đáy rộng hết màn hình, cao theo nội dung; từ 640 px căn giữa
   * theo `size`. Hợp với form.
   */
  layout?: 'centered' | 'sheet';
  /** Bề rộng của `sheet` từ 640 px: `md` 560 px, `lg` 720 px cho form có danh sách hoặc hai cột. */
  size?: 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

const subscribeNothing = () => () => undefined;

/**
 * Khung hộp thoại dùng chung: thẻ `dialog` gốc với `showModal()` nên có sẵn khoá focus, nền mờ
 * và trả focus về nút đã mở khi đóng. Render ra `body` để form trong hộp thoại không lồng trong
 * form của trang. Nội dung chỉ render khi mở.
 */
export function Dialog({
  open,
  onRequestClose,
  labelledBy,
  describedBy,
  initialFocus,
  layout = 'centered',
  size = 'md',
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const container = useSyncExternalStore(
    subscribeNothing,
    () => document.body,
    () => null,
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      const target = typeof initialFocus === 'function' ? initialFocus() : initialFocus?.current;
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // Chạy lại khi `initialFocus` đổi cũng không sao: chỉ mở và đặt focus khi dialog chưa mở.
  }, [open, container, initialFocus]);

  if (!container) {
    return null;
  }

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      // Esc gọi `cancel`: chặn đóng mặc định để trạng thái do React giữ.
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      // Bấm vào nền mờ (chính thẻ dialog) thì xin đóng.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onRequestClose();
        }
      }}
      className={cn(
        'm-auto rounded-lg border border-border bg-surface p-0 text-text shadow-raised backdrop:bg-overlay',
        layout === 'sheet'
          ? cn(
              // Tấm đáy: chỉ cao bằng nội dung, chạm gần đỉnh khi form thật sự dài.
              'mx-0 mt-auto mb-0 max-h-[calc(100dvh-2rem)] w-full max-w-full rounded-b-none border-x-0 border-b-0',
              'sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:rounded-lg sm:border',
              size === 'lg' ? 'sm:max-w-[720px]' : 'sm:max-w-[560px]',
            )
          : 'w-[calc(100%-2rem)] max-w-md',
        className,
      )}
    >
      {open ? children : null}
    </dialog>,
    container,
  );
}
