import { describe, expect, it } from 'vitest';
import { memberStats } from '../src/modules/classes/class-members.service';

const day = (value: string) => new Date(`2026-11-${value}T00:00:00.000Z`);

describe('memberStats', () => {
  const now = day('20');
  const joinedAt = day('10');
  const input = {
    assignments: [
      { id: 'early', dueAt: day('05') },
      { id: 'onTime', dueAt: day('15') },
      { id: 'late', dueAt: day('12') },
      { id: 'missed', dueAt: day('18') },
      { id: 'pending', dueAt: day('25') },
      { id: 'noDue', dueAt: null },
    ],
    submissions: [
      { assignmentId: 'onTime', userId: 'u1', late: false, score: 90 },
      { assignmentId: 'late', userId: 'u1', late: true, score: 75 },
      { assignmentId: 'missed', userId: 'u2', late: false, score: 100 },
    ],
    lastActive: [{ userId: 'u1', at: day('19') }],
  };

  it('đếm đúng hạn, trễ, bỏ lỡ, đang chờ và bỏ bài hết hạn trước khi vào lớp', () => {
    expect(memberStats('u1', joinedAt, input, now)).toEqual({
      onTime: 1,
      late: 1,
      missed: 1,
      pending: 2,
      averageScore: 82.5,
      lastActiveAt: day('19').toISOString(),
    });
  });

  it('chưa nộp bài nào thì điểm trung bình và hoạt động là null', () => {
    expect(memberStats('u3', joinedAt, input, now)).toMatchObject({
      onTime: 0,
      missed: 3,
      averageScore: null,
      lastActiveAt: null,
    });
  });
});
