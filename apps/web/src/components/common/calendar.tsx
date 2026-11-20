'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  addDays,
  compareDays,
  formatDay,
  monthGrid,
  sameDay,
  toCalendarDay,
  type CalendarDay,
} from '@/lib/local-date-time';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

interface CalendarProps {
  selected: CalendarDay | null;
  /** Ngày sớm nhất chọn được. */
  minDay?: CalendarDay;
  /** Không cho chọn ngày đã qua, thay cho `minDay` là hôm nay. */
  disablePast?: boolean;
  onPick: (day: CalendarDay) => void;
}

/**
 * Lịch một tháng, tuần bắt đầu thứ Hai. Mở ra thì focus ngày đang chọn (hoặc hôm nay), phím mũi
 * tên đi qua ngày, Enter chọn. Đọc ngày hôm nay lúc mount, nên chỉ render lịch sau khi người
 * dùng mở để không gọi `new Date()` khi prerender.
 */
export function Calendar({ selected, minDay, disablePast = false, onPick }: CalendarProps) {
  const [today] = useState(() => toCalendarDay(new Date()));
  const earliest = disablePast ? today : minDay;
  const start = selected ?? today;
  const [view, setView] = useState({ year: start.year, month: start.month });
  const [focused, setFocused] = useState<CalendarDay>(start);
  const gridRef = useRef<HTMLDivElement>(null);
  const cells = monthGrid(view.year, view.month);
  const heading = `Tháng ${view.month + 1}, ${view.year}`;

  // Focus ngày đang chọn khi mở và khi di chuyển bằng phím.
  useLayoutEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [focused]);

  const disabled = (cell: CalendarDay) => !!earliest && compareDays(cell, earliest) < 0;
  // Ngày nhận Tab: ngày đang focus nếu thuộc tháng đang xem, không thì ngày 1.
  const focusInView = focused.year === view.year && focused.month === view.month;
  const tabbable = (cell: CalendarDay) => (focusInView ? sameDay(cell, focused) : cell.day === 1);

  const shiftMonth = (amount: number) => {
    const first = new Date(view.year, view.month + amount, 1);
    setView({ year: first.getFullYear(), month: first.getMonth() });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = ARROW_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = addDays(focused, step);
    setFocused(next);
    setView({ year: next.year, month: next.month });
  };

  return (
    <div className="flex w-[19.5rem] flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tháng trước"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Button>
        <p aria-live="polite" className="font-medium">
          {heading}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tháng sau"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight aria-hidden className="size-5" />
        </Button>
      </div>
      <div role="grid" aria-label={heading} ref={gridRef} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((weekday, index) => (
            <span
              key={weekday}
              role="columnheader"
              aria-label={WEEKDAY_NAMES[index]}
              className="flex h-8 items-center justify-center text-small text-text-muted"
            >
              {weekday}
            </span>
          ))}
        </div>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
          <div key={row} role="row" className="grid grid-cols-7">
            {cells.slice(row * 7, row * 7 + 7).map((cell, index) =>
              cell ? (
                <span key={cell.day} role="gridcell">
                  <button
                    type="button"
                    tabIndex={tabbable(cell) ? 0 : -1}
                    data-focused={sameDay(cell, focused)}
                    aria-label={`${WEEKDAY_NAMES[index]}, ${formatDay(cell)}`}
                    aria-pressed={sameDay(cell, selected)}
                    aria-current={sameDay(cell, today) ? 'date' : undefined}
                    disabled={disabled(cell)}
                    onClick={() => onPick(cell)}
                    className={cn(
                      'flex size-11 items-center justify-center rounded-md text-body transition-colors duration-fast ease-standard disabled:pointer-events-none disabled:opacity-40',
                      sameDay(cell, selected)
                        ? 'bg-primary font-semibold text-primary-fg'
                        : 'hover:bg-primary-soft',
                      sameDay(cell, today) && !sameDay(cell, selected)
                        ? 'border border-primary font-semibold text-primary'
                        : null,
                    )}
                  >
                    {cell.day}
                  </button>
                </span>
              ) : (
                <span key={`empty-${index}`} role="gridcell" />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
