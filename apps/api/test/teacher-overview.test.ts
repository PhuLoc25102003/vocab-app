import { describe, expect, it } from 'vitest';
import { buildTeacherOverview } from '../src/modules/classes/teacher-overview.service';

const now = new Date('2026-11-21T12:00:00.000Z');
const at = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000);
const member = (userId: string, joinedAt: Date) => ({
  userId,
  joinedAt,
  user: { displayName: userId.toUpperCase() },
});
const assignment = (id: string, dueAt: Date | null) => ({
  id,
  dueAt,
  createdAt: at(-24 * 20),
  set: { title: `Bộ ${id}` },
});

describe('buildTeacherOverview', () => {
  const input = {
    classes: [
      {
        id: 'c1',
        name: 'Fa1',
        members: [member('an', at(-24 * 20)), member('binh', at(-24 * 20)), member('chi', at(-24))],
        assignments: [
          assignment('old1', at(-24 * 5)),
          assignment('old2', at(-24 * 2)),
          assignment('soon', at(20)),
          assignment('later', at(24 * 7)),
          assignment('noDue', null),
        ],
      },
    ],
    submissions: [
      { assignmentId: 'old1', userId: 'an', late: false, score: 90, submittedAt: at(-24 * 6) },
      { assignmentId: 'old2', userId: 'an', late: true, score: 70, submittedAt: at(-24) },
      { assignmentId: 'soon', userId: 'an', late: false, score: 80, submittedAt: at(-1) },
    ],
  };

  it('tính ô số liệu, cần chú ý, sắp đến hạn và bài vừa nộp', () => {
    const overview = buildTeacherOverview(input, now);

    expect(overview).toMatchObject({
      classCount: 1,
      studentCount: 3,
      newStudents: 1,
      openAssignmentCount: 3,
      dueSoonCount: 1,
      // old1: an, binh phải làm (chi vào sau hạn), an đúng hạn; old2: an trễ, binh bỏ → 1/4.
      onTimeRate: 25,
    });
    expect(overview.attention.lowSubmissions).toEqual([
      expect.objectContaining({ assignmentId: 'soon', submitted: 1, memberCount: 3 }),
    ]);
    // Bình bỏ lỡ cả 2 bài đã hết hạn; Chi vào lớp sau cả hai bài nên không tính.
    expect(overview.attention.missedStreaks).toEqual([
      expect.objectContaining({ userId: 'binh', missed: 2 }),
    ]);
    expect(overview.upcoming.map(({ assignmentId }) => assignmentId)).toEqual(['soon', 'later']);
    expect(overview.recentSubmissions.map(({ assignmentId }) => assignmentId)).toEqual([
      'soon',
      'old2',
      'old1',
    ]);
  });

  it('chưa có lớp thì mọi số liệu bằng 0 và danh sách trống', () => {
    expect(buildTeacherOverview({ classes: [], submissions: [] }, now)).toEqual({
      classCount: 0,
      studentCount: 0,
      newStudents: 0,
      openAssignmentCount: 0,
      dueSoonCount: 0,
      onTimeRate: null,
      attention: { lowSubmissions: [], missedStreaks: [] },
      upcoming: [],
      recentSubmissions: [],
    });
  });
});
