'use client';

import type { StatsOverview } from '@vocab/shared';
import { Snowflake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const BAR_AREA_PX = 96;

function weekday(day: string): string {
  return WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()] ?? '';
}

/** Cột số câu trả lời 7 ngày, một màu, có bảng cho trình đọc màn hình. */
export function ActivityChart({
  activity,
  frozenDays = [],
}: {
  activity: StatsOverview['activity'];
  /** Ngày đã dùng thẻ giữ chuỗi, hiện biểu tượng bông tuyết thay số câu. */
  frozenDays?: readonly string[];
}) {
  const { t } = useTranslation('study');
  const frozen = new Set(frozenDays);
  const max = Math.max(1, ...activity.map(({ answers }) => answers));
  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="text-h3">{t('stats.activity')}</figcaption>
      <div aria-hidden className="flex items-end gap-2" style={{ height: BAR_AREA_PX + 40 }}>
        {activity.map(({ day, answers }, index) => {
          const today = index === activity.length - 1;
          const isFrozen = frozen.has(day);
          return (
            <div
              key={day}
              title={
                isFrozen
                  ? `${weekday(day)}: ${t('stats.frozenDay')}`
                  : t('stats.dayAnswers', { day: weekday(day), count: answers })
              }
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              {isFrozen ? (
                <Snowflake className="size-3.5 text-primary" />
              ) : (
                <span className="text-tiny text-text-muted tabular-nums">{answers}</span>
              )}
              <span
                className="w-full max-w-8 rounded-t-sm bg-primary transition-[height] duration-base ease-standard"
                style={{ height: answers > 0 ? Math.max(4, (answers / max) * BAR_AREA_PX) : 2 }}
              />
              <span className={today ? 'text-tiny font-semibold' : 'text-tiny text-text-muted'}>
                {today ? 'Nay' : weekday(day)}
              </span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>{t('stats.byDay')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('stats.day')}</th>
            <th scope="col">{t('stats.answers')}</th>
          </tr>
        </thead>
        <tbody>
          {activity.map(({ day, answers }) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{frozen.has(day) ? t('stats.frozenDay') : answers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Tỉ lệ từ đã thuộc và đang học, chú thích bằng chữ và số. */
export function MasteryBar({ mastered, learning }: { mastered: number; learning: number }) {
  const { t } = useTranslation('study');
  const total = mastered + learning;
  const segments = [
    { label: t('stats.mastered'), value: mastered, className: 'bg-success' },
    { label: t('stats.learning'), value: learning, className: 'bg-primary' },
  ];
  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="text-h3">{t('stats.masteryTitle')}</figcaption>
      {total === 0 ? (
        <p className="text-text-muted">{t('stats.noWords')}</p>
      ) : (
        <>
          <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-border">
            {segments.map(({ label, value, className }) =>
              value > 0 ? (
                <span
                  key={label}
                  className={className}
                  style={{ width: `${(value / total) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-small">
            {segments.map(({ label, value, className }) => (
              <li key={label} className="flex items-center gap-2">
                <span aria-hidden className={`size-3 rounded-sm ${className}`} />
                {label}: <span className="font-semibold tabular-nums">{value}</span> (
                {Math.round((value / total) * 100)}%)
              </li>
            ))}
          </ul>
          <p className="text-small text-text-muted">{t('stats.masteryRule')}</p>
        </>
      )}
    </figure>
  );
}
