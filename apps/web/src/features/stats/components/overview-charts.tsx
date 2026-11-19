import type { StatsOverview } from '@vocab/shared';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const BAR_AREA_PX = 96;

function weekday(day: string): string {
  return WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()] ?? '';
}

/** Cột số câu trả lời 7 ngày, một màu, có bảng cho trình đọc màn hình. */
export function ActivityChart({ activity }: { activity: StatsOverview['activity'] }) {
  const max = Math.max(1, ...activity.map(({ answers }) => answers));
  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="text-h3">Câu trả lời 7 ngày gần nhất</figcaption>
      <div aria-hidden className="flex items-end gap-2" style={{ height: BAR_AREA_PX + 40 }}>
        {activity.map(({ day, answers }, index) => {
          const today = index === activity.length - 1;
          return (
            <div
              key={day}
              title={`${weekday(day)}: ${answers} câu`}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-tiny text-text-muted tabular-nums">{answers}</span>
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
        <caption>Số câu trả lời theo ngày</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Câu trả lời</th>
          </tr>
        </thead>
        <tbody>
          {activity.map(({ day, answers }) => (
            <tr key={day}>
              <th scope="row">{day}</th>
              <td>{answers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Tỉ lệ từ đã thuộc và đang học, chú thích bằng chữ và số. */
export function MasteryBar({ mastered, learning }: { mastered: number; learning: number }) {
  const total = mastered + learning;
  const segments = [
    { label: 'Đã thuộc', value: mastered, className: 'bg-success' },
    { label: 'Đang học', value: learning, className: 'bg-primary' },
  ];
  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="text-h3">Mức nhớ các từ đã học</figcaption>
      {total === 0 ? (
        <p className="text-text-muted">Chưa có từ nào được học.</p>
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
          <p className="text-small text-text-muted">
            Từ được tính là đã thuộc khi bạn trả lời đúng ở hai ngày khác nhau.
          </p>
        </>
      )}
    </figure>
  );
}
