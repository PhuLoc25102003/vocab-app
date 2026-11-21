import { describe, expect, it } from 'vitest';
import { classListStats } from '../src/modules/classes/classes.service';

const day = (value: string) => new Date(`2026-11-${value}T00:00:00.000Z`);

describe('classListStats', () => {
  const now = day('20');
  const since = day('01');
  const input = {
    assignments: [
      { id: 'a1', classId: 'c1', dueAt: day('10') },
      { id: 'a2', classId: 'c1', dueAt: day('15') },
      { id: 'open', classId: 'c1', dueAt: day('25') },
      { id: 'noDue', classId: 'c1', dueAt: null },
      { id: 'other', classId: 'c2', dueAt: day('10') },
    ],
    members: [
      { classId: 'c1', userId: 'u1', joinedAt: day('01') },
      { classId: 'c1', userId: 'u2', joinedAt: day('12') },
    ],
    onTime: [
      { assignmentId: 'a1', userId: 'u1' },
      { assignmentId: 'a2', userId: 'u2' },
    ],
  };

  it('đếm bài đang mở và tỉ lệ đúng hạn, bỏ học sinh vào lớp sau hạn', () => {
    // a1: chỉ u1 tính (u2 vào sau hạn) và đã nộp; a2: u1 chưa nộp, u2 đã nộp → 2/3.
    expect(classListStats('c1', input, since, now)).toEqual({
      openAssignmentCount: 2,
      onTimeRate: 67,
    });
  });

  it('chưa có bài hết hạn thì tỉ lệ là null', () => {
    expect(classListStats('c3', input, since, now)).toEqual({
      openAssignmentCount: 0,
      onTimeRate: null,
    });
  });
});
