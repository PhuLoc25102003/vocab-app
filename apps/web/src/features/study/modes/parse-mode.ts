import { studyModeSchema, type StudyMode } from '@vocab/shared';
import { STUDY_VIEWS } from './views';

/** Đường dẫn dùng chữ thường, ví dụ `/study/flashcard`. Chế độ chưa có view coi như không tồn tại. */
export function parseStudyMode(value: string): StudyMode | null {
  const mode = studyModeSchema.safeParse(value.toUpperCase());
  return mode.success && STUDY_VIEWS[mode.data] ? mode.data : null;
}
