import { describe, expect, it } from 'vitest';
import { dailySeries } from '../src/modules/admin/admin-stats.repository';

describe('dailySeries', () => {
  const now = new Date('2026-11-21T05:00:00.000Z');

  it('đủ 30 ngày, cũ nhất trước, đếm đăng ký và người hoạt động khác nhau theo giờ Việt Nam', () => {
    const series = dailySeries(
      [new Date('2026-11-21T01:00:00.000Z'), new Date('2026-11-20T18:00:00.000Z')],
      [
        { userId: 'a', startedAt: new Date('2026-11-21T02:00:00.000Z') },
        { userId: 'a', startedAt: new Date('2026-11-21T03:00:00.000Z') },
        { userId: 'b', startedAt: new Date('2026-11-20T16:59:00.000Z') },
      ],
      now,
    );

    expect(series).toHaveLength(30);
    expect(series.at(-1)).toEqual({ day: '2026-11-21', signups: 2, active: 1 });
    // 16:59 UTC ngày 20 là 23:59 giờ Việt Nam ngày 20.
    expect(series.at(-2)).toEqual({ day: '2026-11-20', signups: 0, active: 1 });
    expect(series[0]?.day).toBe('2026-10-23');
  });
});
