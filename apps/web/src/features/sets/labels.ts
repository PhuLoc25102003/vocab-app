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
