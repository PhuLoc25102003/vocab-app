'use client';

import { useEffect, useState } from 'react';

const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'radio',
  'range',
  'submit',
  'reset',
  'file',
]);

/** Phần tử đang focus có làm bàn phím máy của điện thoại hiện lên không. */
export function opensDeviceKeyboard(element: Element | null): boolean {
  if (
    !(element instanceof HTMLElement) ||
    (element.inputMode || element.getAttribute('inputmode')) === 'none'
  ) {
    return false;
  }
  if (element instanceof HTMLTextAreaElement) return !element.readOnly;
  if (element instanceof HTMLInputElement) {
    return !element.readOnly && !NON_TEXT_INPUTS.has(element.type);
  }
  return element.isContentEditable === true;
}

const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

/** Trên màn cảm ứng, đang gõ vào ô có bàn phím máy, để thu gọn bố cục cho câu hỏi không bị che. */
export function useTypingFocus(): boolean {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const check = () => setTyping(isTouch() && opensDeviceKeyboard(document.activeElement));
    // `focusout` chạy trước khi focus sang phần tử mới, nên đợi một nhịp rồi mới đọc lại.
    const onFocusOut = () => setTimeout(check, 0);
    check();
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);
  return typing;
}

/**
 * Cuộn `element` lên đầu vùng nhìn thấy sau khi bàn phím máy mở xong
 * (đợi `visualViewport` đổi cỡ, quá 600 ms thì cuộn luôn).
 */
export function revealAboveKeyboard(element: HTMLElement | null) {
  if (!element || !isTouch()) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const viewport = window.visualViewport;
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    viewport?.removeEventListener('resize', reveal);
    element.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  };
  viewport?.addEventListener('resize', reveal);
  setTimeout(reveal, 600);
}
