/** Thẻ đã nhớ qua ít nhất hai lần ôn cách ngày được tính là đã thuộc. */
export const MASTERED_INTERVAL_DAYS = 6;

/** Học sinh ở Việt Nam, ngày học tính theo UTC+7 và không có giờ mùa hè. */
export const STUDY_DAY_OFFSET_HOURS = 7;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Ngày học dạng `YYYY-MM-DD`. */
export function toStudyDay(date: Date): string {
  return new Date(date.getTime() + STUDY_DAY_OFFSET_HOURS * HOUR_MS).toISOString().slice(0, 10);
}

/** Thời điểm bắt đầu ngày học chứa `date`. */
export function startOfStudyDay(date: Date): Date {
  const dayStart = Date.parse(`${toStudyDay(date)}T00:00:00.000Z`);
  return new Date(dayStart - STUDY_DAY_OFFSET_HOURS * HOUR_MS);
}

/** Chuỗi ngày học liên tiếp. Chưa học hôm nay vẫn giữ chuỗi nếu hôm qua có học. */
export function computeStreak(days: Iterable<string>, now: Date): number {
  const studied = new Set(days);
  let cursor = now.getTime();
  if (!studied.has(toStudyDay(new Date(cursor)))) {
    cursor -= DAY_MS;
  }

  let streak = 0;
  while (studied.has(toStudyDay(new Date(cursor)))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}
