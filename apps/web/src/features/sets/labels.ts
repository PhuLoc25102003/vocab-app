import type { Visibility } from '@vocab/shared';

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  PRIVATE: 'Riêng tư',
  CLASS: 'Lớp học',
  PUBLIC: 'Công khai',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'Tiếng Anh',
  vi: 'Tiếng Việt',
  ja: 'Tiếng Nhật',
  ko: 'Tiếng Hàn',
  zh: 'Tiếng Trung',
  fr: 'Tiếng Pháp',
  de: 'Tiếng Đức',
  es: 'Tiếng Tây Ban Nha',
};

/** Các chế độ đã có giao diện, chế độ đầu tiên là nút chính. */
export const STUDY_ENTRIES = [
  { slug: 'flashcard', label: 'Bắt đầu học', guestLabel: 'Học thử' },
  { slug: 'write', label: 'Luyện viết', guestLabel: 'Luyện viết' },
  { slug: 'dictation', label: 'Nghe viết', guestLabel: 'Nghe viết' },
] as const;
