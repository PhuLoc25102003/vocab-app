import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Giới hạn mỗi lần chạy để một lần gọi không kéo dài quá lâu trên Render gói Free. */
export const REMINDER_BATCH = 2000;

export interface DailyCandidate {
  id: string;
  studiedYesterday: boolean;
  dueCards: number;
}

export interface DueAssignmentRow {
  assignmentId: string;
  userId: string;
  setTitle: string;
  dueAt: Date;
}

@Injectable()
export class RemindersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Người chưa học hôm nay và chưa được nhắc trong ngày `day`, kèm hôm qua có học không và số thẻ
   * đến hạn (bộ chưa xoá). Bỏ tài khoản bị khoá hoặc đã xoá.
   */
  findDailyCandidates(day: string, yesterdayStart: Date, todayStart: Date, now: Date) {
    return this.prisma.$queryRaw<DailyCandidate[]>`
      SELECT u.id,
        EXISTS (
          SELECT 1 FROM "Attempt" a JOIN "StudySession" s ON s.id = a."sessionId"
          WHERE s."userId" = u.id AND a."createdAt" >= ${yesterdayStart} AND a."createdAt" < ${todayStart}
        ) AS "studiedYesterday",
        (
          SELECT count(*)::int FROM "CardProgress" cp
          JOIN "Card" c ON c.id = cp."cardId"
          JOIN "StudySet" st ON st.id = c."setId"
          WHERE cp."userId" = u.id AND cp."dueAt" <= ${now} AND st."deletedAt" IS NULL
        ) AS "dueCards"
      FROM "User" u
      WHERE u."lockedAt" IS NULL AND u."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "Attempt" a JOIN "StudySession" s ON s.id = a."sessionId"
          WHERE s."userId" = u.id AND a."createdAt" >= ${todayStart}
        )
        AND NOT EXISTS (
          SELECT 1 FROM "ReminderLog" r
          WHERE r."userId" = u.id AND r.kind = 'DAILY' AND r.key = ${day}
        )
      LIMIT ${REMINDER_BATCH}::int`;
  }

  /** Học sinh chưa nộp bài hết hạn trong `(now, until]`, lớp chưa lưu trữ, chưa được nhắc bài đó. */
  findDueAssignments(now: Date, until: Date) {
    return this.prisma.$queryRaw<DueAssignmentRow[]>`
      SELECT a.id AS "assignmentId", m."userId", st.title AS "setTitle", a."dueAt"
      FROM "Assignment" a
      JOIN "Class" c ON c.id = a."classId"
      JOIN "ClassMember" m ON m."classId" = a."classId"
      JOIN "StudySet" st ON st.id = a."setId"
      JOIN "User" u ON u.id = m."userId"
      WHERE a."dueAt" > ${now} AND a."dueAt" <= ${until}
        AND c."archivedAt" IS NULL AND u."lockedAt" IS NULL AND u."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "AssignmentSubmission" sub
          WHERE sub."assignmentId" = a.id AND sub."userId" = m."userId"
        )
        AND NOT EXISTS (
          SELECT 1 FROM "ReminderLog" r
          WHERE r."userId" = m."userId" AND r.kind = 'ASSIGNMENT_DUE' AND r.key = a.id
        )
      LIMIT ${REMINDER_BATCH}::int`;
  }

  async logReminders(
    rows: readonly { userId: string; kind: 'DAILY' | 'ASSIGNMENT_DUE'; key: string }[],
  ) {
    if (rows.length === 0) return;
    await this.prisma.reminderLog.createMany({ data: [...rows], skipDuplicates: true });
  }
}
