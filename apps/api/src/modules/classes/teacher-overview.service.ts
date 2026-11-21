import { Injectable } from '@nestjs/common';
import type { OverviewAssignment, TeacherOverview } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { TeacherOverviewRepository } from './teacher-overview.repository';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DUE_SOON_MS = 48 * HOUR_MS;
const UPCOMING_LIMIT = 5;
const RECENT_LIMIT = 10;
const ATTENTION_LIMIT = 5;
const MISSED_STREAK_MIN = 2;

export interface OverviewInput {
  classes: {
    id: string;
    name: string;
    members: { userId: string; joinedAt: Date; user: { displayName: string } }[];
    assignments: { id: string; dueAt: Date | null; createdAt: Date; set: { title: string } }[];
  }[];
  submissions: {
    assignmentId: string;
    userId: string;
    late: boolean;
    score: number | null;
    submittedAt: Date;
  }[];
}

/**
 * Tổng quan của giáo viên (việc 5.19). Học sinh chỉ phải làm bài có hạn từ lúc em vào lớp trở đi
 * (bài không hạn thì ai cũng phải làm); bài nộp của học sinh đã rời lớp không tính.
 */
export function buildTeacherOverview(input: OverviewInput, now = new Date()): TeacherOverview {
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const soon = new Date(now.getTime() + DUE_SOON_MS);
  const submitted = new Map(
    input.submissions.map((item) => [`${item.assignmentId}:${item.userId}`, item]),
  );

  const students = new Set<string>();
  const newStudents = new Set<string>();
  const open: OverviewAssignment[] = [];
  const missedStreaks: TeacherOverview['attention']['missedStreaks'] = [];
  const recent: TeacherOverview['recentSubmissions'] = [];
  let expected = 0;
  let onTime = 0;

  for (const klass of input.classes) {
    const memberIds = new Set(klass.members.map(({ userId }) => userId));
    for (const { userId, joinedAt } of klass.members) {
      students.add(userId);
      if (joinedAt >= since7) newStudents.add(userId);
    }
    const mustDo = (dueAt: Date | null) =>
      klass.members.filter(({ joinedAt }) => !dueAt || joinedAt <= dueAt);

    for (const assignment of klass.assignments) {
      const roster = mustDo(assignment.dueAt);
      const handedIn = roster.filter(({ userId }) => submitted.has(`${assignment.id}:${userId}`));
      if (!assignment.dueAt || assignment.dueAt > now) {
        open.push({
          assignmentId: assignment.id,
          classId: klass.id,
          className: klass.name,
          setTitle: assignment.set.title,
          dueAt: assignment.dueAt?.toISOString() ?? null,
          submitted: handedIn.length,
          memberCount: roster.length,
        });
      } else if (assignment.dueAt >= since30) {
        expected += roster.length;
        onTime += handedIn.filter(
          ({ userId }) => submitted.get(`${assignment.id}:${userId}`)?.late === false,
        ).length;
      }
    }

    // Chuỗi bỏ lỡ: đếm từ bài hết hạn gần nhất lùi lại, dừng ở bài đầu tiên em đã nộp.
    const past = klass.assignments
      .filter(({ dueAt }) => dueAt && dueAt <= now && dueAt >= since30)
      .sort((a, b) => (b.dueAt?.getTime() ?? 0) - (a.dueAt?.getTime() ?? 0));
    for (const member of klass.members) {
      let streak = 0;
      for (const assignment of past) {
        if (assignment.dueAt && member.joinedAt > assignment.dueAt) break;
        if (submitted.has(`${assignment.id}:${member.userId}`)) break;
        streak += 1;
      }
      if (streak >= MISSED_STREAK_MIN) {
        missedStreaks.push({
          userId: member.userId,
          displayName: member.user.displayName,
          classId: klass.id,
          className: klass.name,
          missed: streak,
        });
      }
    }

    const titles = new Map(klass.assignments.map(({ id, set }) => [id, set.title]));
    const names = new Map(klass.members.map(({ userId, user }) => [userId, user.displayName]));
    for (const item of input.submissions) {
      const setTitle = titles.get(item.assignmentId);
      const displayName = names.get(item.userId);
      if (!setTitle || !displayName || !memberIds.has(item.userId)) continue;
      recent.push({
        userId: item.userId,
        displayName,
        classId: klass.id,
        className: klass.name,
        assignmentId: item.assignmentId,
        setTitle,
        score: item.score,
        late: item.late,
        submittedAt: item.submittedAt.toISOString(),
      });
    }
  }

  const byDue = (a: OverviewAssignment, b: OverviewAssignment) =>
    (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity);
  const dueSoon = open.filter(({ dueAt }) => dueAt && new Date(dueAt) <= soon);
  return {
    classCount: input.classes.length,
    studentCount: students.size,
    newStudents: newStudents.size,
    openAssignmentCount: open.length,
    dueSoonCount: dueSoon.length,
    onTimeRate: expected ? Math.round((onTime * 100) / expected) : null,
    attention: {
      lowSubmissions: dueSoon
        .filter(({ submitted, memberCount }) => memberCount > 0 && submitted * 2 < memberCount)
        .sort(byDue)
        .slice(0, ATTENTION_LIMIT),
      missedStreaks: missedStreaks
        .sort((a, b) => b.missed - a.missed || a.displayName.localeCompare(b.displayName, 'vi'))
        .slice(0, ATTENTION_LIMIT),
    },
    upcoming: open
      .filter(({ dueAt }) => dueAt)
      .sort(byDue)
      .slice(0, UPCOMING_LIMIT),
    recentSubmissions: recent
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
      .slice(0, RECENT_LIMIT),
  };
}

@Injectable()
export class TeacherOverviewService {
  constructor(private readonly overview: TeacherOverviewRepository) {}

  async get(teacherId: string) {
    return ok(buildTeacherOverview(await this.overview.findTeacherData(teacherId)));
  }
}
