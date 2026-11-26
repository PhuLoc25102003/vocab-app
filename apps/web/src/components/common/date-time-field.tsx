'use client';

import { CalendarDays } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Calendar } from '@/components/common/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  addDays,
  formatDay,
  fromLocalValue,
  parseDay,
  parseTime,
  toCalendarDay,
  toLocalValue,
  type CalendarDay,
} from '@/lib/local-date-time';
import { useTranslation } from 'react-i18next';

const PANEL_GAP = 4;
const EDGE = 8;

interface DateTimeFieldProps {
  label: string;
  /** Tên của ô ẩn chứa giá trị `YYYY-MM-DDTHH:mm`, để đọc bằng `FormData`. */
  name?: string;
  defaultValue?: string;
  /** Gọi mỗi khi giá trị đổi: chuỗi rỗng là chưa chọn, `invalid` là gõ sai. */
  onValueChange?: (value: string) => void;
  /** Giờ dùng khi chỉ chọn ngày. */
  defaultTime?: string;
  /** Ngày sớm nhất chọn được trên lịch. */
  minDay?: CalendarDay;
  /** Không cho chọn ngày đã qua trên lịch, thay cho `minDay` là hôm nay. */
  disablePast?: boolean;
  hint?: string;
  error?: string;
  /** Nút "Không có hạn" để xoá. */
  clearLabel?: string;
}

/**
 * Chọn ngày giờ kiểu Việt Nam: ngày `dd/mm/yyyy`, giờ 24 tiếng, lịch tuần bắt đầu thứ Hai và
 * nút chọn nhanh. Thay `datetime-local` vì ô gốc hiện theo ngôn ngữ máy và màu của trình duyệt.
 * Lịch nằm trong `popover` gốc nên không bị cắt khi đặt trong hộp thoại có thanh cuộn.
 */
export function DateTimeField({
  label,
  name,
  defaultValue = '',
  onValueChange,
  defaultTime = '23:59',
  minDay,
  disablePast = false,
  hint,
  error,
  clearLabel,
}: DateTimeFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const initial = fromLocalValue(defaultValue);
  const [dateText, setDateText] = useState(initial ? formatDay(initial.day) : '');
  const [timeText, setTimeText] = useState(initial?.time ?? defaultTime);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  // Nghe `toggle` gốc của popover: Esc, bấm ra ngoài hay chọn ngày đều đóng lịch.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onToggle = (event: Event) => {
      setCalendarOpen((event as Event & { newState?: string }).newState === 'open');
    };
    panel.addEventListener('toggle', onToggle);
    return () => panel.removeEventListener('toggle', onToggle);
  }, []);

  // Đặt lịch ngay dưới nút mở (hoặc phía trên khi thiếu chỗ), canh phải theo nút, cách mép 8 px.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!calendarOpen || !panel || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = rect.bottom + PANEL_GAP;
    const top =
      below + panel.offsetHeight > window.innerHeight
        ? rect.top - PANEL_GAP - panel.offsetHeight
        : below;
    const maxLeft = window.innerWidth - panel.offsetWidth - EDGE;
    panel.style.position = 'fixed';
    panel.style.top = `${Math.max(EDGE, top)}px`;
    panel.style.left = `${Math.max(EDGE, Math.min(rect.right - panel.offsetWidth, maxLeft))}px`;
  }, [calendarOpen]);

  const day = parseDay(dateText);
  const time = parseTime(timeText);
  const value = dateText.trim() === '' ? '' : day && time ? toLocalValue(day, time) : 'invalid';

  const update = (nextDate: string, nextTime: string) => {
    setDateText(nextDate);
    setTimeText(nextTime);
    const d = parseDay(nextDate);
    const t = parseTime(nextTime);
    onValueChange?.(nextDate.trim() === '' ? '' : d && t ? toLocalValue(d, t) : 'invalid');
  };

  const pick = (picked: CalendarDay) => {
    update(formatDay(picked), time ?? defaultTime);
    panelRef.current?.hidePopover?.();
    dateRef.current?.focus();
  };

  // Số ngày tính từ hôm nay. Ngày hôm nay chỉ đọc khi bấm, không đọc lúc render vì Next cấm
  // `new Date()` khi prerender.
  const presets: { label: string; offset: number | null }[] = [
    { label: t('dateTime.endOfToday'), offset: 0 },
    { label: t('dateTime.tomorrow'), offset: 1 },
    { label: t('dateTime.oneWeek'), offset: 7 },
    { label: clearLabel ?? t('dateTime.noDue'), offset: null },
  ];

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" aria-describedby={describedBy || undefined}>
      <legend className="mb-1 text-small font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-0 flex-[2_1_10rem] gap-1">
          <Input
            ref={dateRef}
            aria-label={t('dateTime.day')}
            inputMode="numeric"
            placeholder="dd/mm/yyyy"
            autoComplete="off"
            value={dateText}
            aria-invalid={dateText.trim() !== '' && !day ? true : undefined}
            onChange={(event) => update(event.target.value, timeText)}
            className="min-w-0"
          />
          <Button
            ref={triggerRef}
            type="button"
            variant="secondary"
            size="icon"
            aria-label={t('dateTime.pickOnCalendar')}
            aria-expanded={calendarOpen}
            aria-controls={`${id}-calendar`}
            onClick={() => panelRef.current?.togglePopover?.()}
            className="shrink-0"
          >
            <CalendarDays aria-hidden className="size-5" />
          </Button>
        </div>
        <Input
          aria-label={t('dateTime.time')}
          inputMode="numeric"
          placeholder="23:59"
          autoComplete="off"
          value={timeText}
          aria-invalid={!time ? true : undefined}
          onChange={(event) => update(dateText, event.target.value)}
          onBlur={() => {
            if (time) setTimeText(time);
          }}
          className="min-w-0 flex-[1_1_5.5rem]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              preset.offset === null
                ? update('', defaultTime)
                : update(formatDay(addDays(toCalendarDay(new Date()), preset.offset)), defaultTime)
            }
            className="glass-button min-h-11 rounded-full px-3 text-small"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div
        ref={panelRef}
        id={`${id}-calendar`}
        popover="auto"
        role="dialog"
        aria-label={t('dateTime.pickDay')}
        className="glass-overlay glass-pop inset-auto m-0 origin-top rounded-sheet p-4 text-text"
      >
        {calendarOpen ? (
          <Calendar selected={day} minDay={minDay} disablePast={disablePast} onPick={pick} />
        ) : null}
      </div>
    </fieldset>
  );
}
