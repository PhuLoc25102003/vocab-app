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
  {
    slug: 'flashcard',
    label: 'Flashcard',
    hint: 'Lật thẻ, tự đánh giá đã nhớ hay chưa',
  },
  {
    slug: 'learn',
    label: 'Học kỹ',
    hint: 'Trắc nghiệm rồi gõ từ, câu sai hỏi lại',
  },
  { slug: 'write', label: 'Luyện viết', hint: 'Nhìn nghĩa, gõ lại từ' },
  {
    slug: 'dictation',
    label: 'Nghe viết',
    hint: 'Nghe phát âm, gõ từ nghe được',
  },
  {
    slug: 'mcq',
    label: 'Trắc nghiệm',
    hint: 'Chọn nghĩa đúng trong bốn đáp án',
  },
  {
    slug: 'cloze',
    label: 'Điền từ',
    hint: 'Điền từ còn thiếu vào câu ví dụ',
  },
  {
    slug: 'match',
    label: 'Ghép cặp',
    hint: 'Ghép từ với nghĩa thật nhanh',
  },
  {
    slug: 'test',
    label: 'Kiểm tra',
    hint: 'Làm bài nhiều dạng, chấm khi nộp',
  },
  {
    slug: 'speak',
    label: 'Luyện nói',
    hint: 'Đọc to từ, máy nhận giọng nói',
  },
] as const;
