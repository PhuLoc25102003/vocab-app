import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createI18n } from '@/lib/i18n/config';

// Component dùng `useTranslation` render được không cần bọc provider: instance `vi` toàn cục.
createI18n('vi');

// Server component gọi `getT` đọc cookie: trong test không có cookie nên là tiếng Việt.
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get: () => undefined }),
}));

// jsdom không có matchMedia.
window.matchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

// jsdom chưa có `showModal` và `close` của thẻ dialog.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Popover API của jsdom chưa đủ (sự kiện `toggle` không chắc có). Luôn dùng bản giả bật tắt
// thuộc tính và phát `toggle` ngay, như trình duyệt báo `newState`.
{
  const setPopover = (element: HTMLElement, open: boolean) => {
    if (element.hasAttribute('data-popover-open') === open) return;
    element.toggleAttribute('data-popover-open', open);
    const event = new Event('toggle');
    Object.assign(event, {
      newState: open ? 'open' : 'closed',
      oldState: open ? 'closed' : 'open',
    });
    element.dispatchEvent(event);
  };
  // jsdom ẩn `[popover]` theo trạng thái riêng của nó; bản giả mở thì phải hiện lại.
  const style = document.createElement('style');
  style.textContent = '[popover][data-popover-open] { display: block !important; }';
  document.head.append(style);
  Object.assign(HTMLElement.prototype, {
    showPopover(this: HTMLElement) {
      setPopover(this, true);
    },
    hidePopover(this: HTMLElement) {
      setPopover(this, false);
    },
    togglePopover(this: HTMLElement) {
      setPopover(this, !this.hasAttribute('data-popover-open'));
    },
  });
}

afterEach(() => {
  cleanup();
});
