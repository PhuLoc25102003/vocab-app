'use client';

import { useEffect, useState } from 'react';

/**
 * Giá trị chỉ cập nhật sau khi `value` đứng yên `delayMs` mili giây, ví dụ chữ tìm kiếm để không
 * lọc hoặc gọi API ở mỗi phím. `delayMs` bằng 0 thì trả ngay `value`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (delayMs <= 0) return;
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return delayMs <= 0 ? value : debounced;
}
