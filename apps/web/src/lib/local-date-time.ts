/** Ngày theo lịch, tháng tính từ 0 như `Date`. */
export interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function toCalendarDay(date: Date): CalendarDay {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export function sameDay(a: CalendarDay | null, b: CalendarDay | null): boolean {
  return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Cộng số ngày, tự sang tháng, năm. */
export function addDays(day: CalendarDay, amount: number): CalendarDay {
  return toCalendarDay(new Date(day.year, day.month, day.day + amount));
}

/** So sánh theo lịch: âm nếu `a` trước `b`. */
export function compareDays(a: CalendarDay, b: CalendarDay): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function formatDay({ year, month, day }: CalendarDay): string {
  return `${pad(day)}/${pad(month + 1)}/${year}`;
}

/** Nhận `dd/mm/yyyy`, cho phép 1 chữ số và dấu `-` hoặc `.`; ngày không có thật trả `null`. */
export function parseDay(text: string): CalendarDay | null {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? { year, month, day }
    : null;
}

/** Nhận `HH:mm`, `H:mm`, `HHmm` hoặc `HH`, giờ 24 tiếng; trả lại dạng `HH:mm`. */
export function parseTime(text: string): string | null {
  const match = /^(\d{1,2})(?:[:.h]?(\d{2}))?$/.exec(text.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  return hours < 24 && minutes < 60 ? `${pad(hours)}:${pad(minutes)}` : null;
}

/** Giá trị kiểu `datetime-local` (`YYYY-MM-DDTHH:mm`), hiểu theo giờ máy. */
export function toLocalValue(day: CalendarDay, time: string): string {
  return `${day.year}-${pad(day.month + 1)}-${pad(day.day)}T${time}`;
}

/** Tách giá trị `YYYY-MM-DDTHH:mm` thành ngày và giờ; sai định dạng trả `null`. */
export function fromLocalValue(value: string): { day: CalendarDay; time: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(value);
  if (!match) return null;
  const day = { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  return { day, time: match[4] ?? '00:00' };
}

/** Các ô của tháng, tuần bắt đầu từ thứ Hai; `null` là ô trống trước ngày 1. */
export function monthGrid(year: number, month: number): (CalendarDay | null)[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length }, (_, index) => ({ year, month, day: index + 1 })),
  ];
}
