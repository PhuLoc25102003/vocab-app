/** Ngôn ngữ có sẵn trong ô chọn; tên hiển thị ở `sets:languages.<mã>`. */
export const LANGUAGE_CODES = ['en', 'vi', 'ja', 'ko', 'zh', 'fr', 'de', 'es'] as const;

/** Các chế độ đã có giao diện, theo thứ tự hiện; tên và gợi ý ở `sets:modes.<slug>`. */
export const STUDY_ENTRIES = [
  { slug: 'flashcard' },
  { slug: 'learn' },
  { slug: 'write' },
  { slug: 'dictation' },
  { slug: 'mcq' },
  { slug: 'cloze' },
  { slug: 'match' },
  { slug: 'test' },
  { slug: 'speak' },
] as const;
