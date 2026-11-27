import { en } from './messages-en';
import { vi } from './messages-vi';

/**
 * Đủ cả hai ngôn ngữ, cho server và test. Code chạy ở client không import file này để tiếng Anh
 * không vào bundle chung (chỉ tải khi cần qua `loadLocale`).
 */
export const resources = { vi, en } as const;
