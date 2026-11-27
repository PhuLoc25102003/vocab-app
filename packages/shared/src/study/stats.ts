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

/**
 * Chuỗi ngày học liên tiếp. Chưa học hôm nay vẫn giữ chuỗi nếu hôm qua có học.
 * Ngày đã dùng thẻ giữ chuỗi (`frozen`) nối chuỗi nhưng không được tính thêm một ngày.
 */
export function computeStreak(
  days: Iterable<string>,
  now: Date,
  frozen: Iterable<string> = [],
): number {
  const studied = new Set(days);
  const kept = new Set(frozen);
  const covered = (cursor: number) => {
    const day = toStudyDay(new Date(cursor));
    return studied.has(day) || kept.has(day);
  };
  let cursor = now.getTime();
  if (!covered(cursor)) {
    cursor -= DAY_MS;
  }

  let streak = 0;
  while (covered(cursor)) {
    if (studied.has(toStudyDay(new Date(cursor)))) {
      streak += 1;
    }
    cursor -= DAY_MS;
  }
  return streak;
}

/** Số thẻ giữ chuỗi tối đa được giữ, mỗi thứ Hai được thêm một thẻ. */
export const MAX_STREAK_FREEZES = 2;

/** Thứ Hai (giờ Việt Nam) của tuần chứa `date`, dạng `YYYY-MM-DD`. */
export function toStudyWeek(date: Date): string {
  const day = toStudyDay(date);
  const weekday = new Date(`${day}T00:00:00.000Z`).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - sinceMonday * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Thời điểm bắt đầu tuần học: 00:00 thứ Hai giờ Việt Nam. */
export function startOfStudyWeek(date: Date): Date {
  return new Date(
    Date.parse(`${toStudyWeek(date)}T00:00:00.000Z`) - STUDY_DAY_OFFSET_HOURS * HOUR_MS,
  );
}

/**
 * Cộng thẻ của các thứ Hai đã qua kể từ lần cấp trước, giữ tối đa `MAX_STREAK_FREEZES`.
 * `lastWeek = null` là tài khoản chưa từng được tính: giữ nguyên số thẻ, chỉ ghi nhận tuần này.
 */
export function grantStreakFreezes(
  held: number,
  lastWeek: string | null,
  now: Date,
): { held: number; week: string } {
  const week = toStudyWeek(now);
  if (lastWeek === null || lastWeek >= week) {
    return { held, week: lastWeek === null ? week : lastWeek };
  }
  const weeks = Math.round((Date.parse(week) - Date.parse(lastWeek)) / (7 * DAY_MS));
  return { held: Math.min(MAX_STREAK_FREEZES, held + weeks), week };
}

/**
 * Ngày cần dùng thẻ giữ chuỗi: hôm qua không học, không có thẻ, và hôm kia có học.
 * Bỏ lỡ từ hai ngày liền thì không dùng thẻ, chuỗi về 0.
 */
export function freezableDay(
  days: Iterable<string>,
  frozen: Iterable<string>,
  now: Date,
): string | null {
  const studied = new Set(days);
  const kept = new Set(frozen);
  const yesterday = toStudyDay(new Date(now.getTime() - DAY_MS));
  const before = toStudyDay(new Date(now.getTime() - 2 * DAY_MS));
  if (studied.has(yesterday) || kept.has(yesterday) || !studied.has(before)) {
    return null;
  }
  return yesterday;
}

export type CardMastery = 'new' | 'learning' | 'mastered';

/**
 * Mức nhớ của một thẻ. Đúng lần đầu thì hẹn ôn sau 1 ngày, đúng tiếp khi đến hạn thì giãn ra
 * 6 ngày, lúc đó mới là đã thuộc. Học dồn trong cùng ngày không làm thẻ tiến lên.
 */
export function cardMastery(progress: { interval: number } | null): CardMastery {
  if (!progress) return 'new';
  return progress.interval >= MASTERED_INTERVAL_DAYS ? 'mastered' : 'learning';
}
