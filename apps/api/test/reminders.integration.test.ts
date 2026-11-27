import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const SECRET = 'test-only-jobs-secret-at-least-32-characters';
const DAY_MS = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

describe('POST /internal/jobs/daily-reminders', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacherId: string;
  let setId: string;
  let cardIds: string[];

  const run = (secret: string | null = SECRET) => {
    const req = request(app.getHttpServer()).post('/api/v1/internal/jobs/daily-reminders');
    return secret === null ? req : req.set('X-Job-Secret', secret);
  };
  const createUser = async (name: string) =>
    (await prisma.user.create({ data: { email: `${name}@example.com`, displayName: name } })).id;
  const studiedOn = async (userId: string, days: number[]) => {
    const session = await prisma.studySession.create({
      data: { userId, setId, mode: 'FLASHCARD' },
    });
    await prisma.attempt.createMany({
      data: days.map((day) => ({
        sessionId: session.id,
        cardId: cardIds[0]!,
        answer: 'known',
        isCorrect: true,
        timeMs: 1,
        createdAt: daysAgo(day),
      })),
    });
  };
  const dueCards = (userId: string, count: number) =>
    prisma.cardProgress.createMany({
      data: cardIds.slice(0, count).map((cardId) => ({
        userId,
        cardId,
        reps: 1,
        dueAt: daysAgo(1),
      })),
    });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacherId = (
      await prisma.user.create({
        data: { email: 'teacher@example.com', displayName: 'teacher', role: 'TEACHER' },
      })
    ).id;
    const set = await prisma.studySet.create({
      data: {
        ownerId: teacherId,
        title: 'Unit 5',
        visibility: 'PUBLIC',
        cardCount: 12,
        cards: {
          create: Array.from({ length: 12 }, (_, i) => ({
            term: `w${i}`,
            definition: `n${i}`,
            position: i,
          })),
        },
      },
      include: { cards: true },
    });
    setId = set.id;
    cardIds = set.cards.map(({ id }) => id);
  });

  afterAll(async () => {
    await app.close();
  });

  it('từ chối khi thiếu hoặc sai khoá', async () => {
    await run(null).expect(401);
    await run('sai-khoa').expect(401);
  });

  it('nhắc người có chuỗi từ 3 ngày chưa học hôm nay và người có từ 10 thẻ đến hạn', async () => {
    const streaker = await createUser('streaker');
    await studiedOn(streaker, [1, 2, 3]);
    const reviewer = await createUser('reviewer');
    await dueCards(reviewer, 10);
    const short = await createUser('short');
    await studiedOn(short, [1, 2]);
    const doneToday = await createUser('done');
    await studiedOn(doneToday, [0, 1, 2, 3]);
    await dueCards(doneToday, 12);

    const { body } = await run().expect(200);
    expect(body.data).toEqual({ daily: 2, assignments: 0 });

    const notes = await prisma.notification.findMany({ select: { userId: true, data: true } });
    expect(notes).toEqual(
      expect.arrayContaining([
        { userId: streaker, data: { count: 0, streakDays: 3 } },
        { userId: reviewer, data: { count: 10, streakDays: 0 } },
      ]),
    );
    expect(notes).toHaveLength(2);

    // Chạy lại trong ngày không gửi trùng.
    expect((await run().expect(200)).body.data).toEqual({ daily: 0, assignments: 0 });
  });

  it('nhắc học sinh chưa nộp bài hết hạn trong 24 giờ, một lần mỗi bài', async () => {
    const waiting = await createUser('waiting');
    const submitted = await createUser('submitted');
    const klass = await prisma.class.create({
      data: {
        teacherId,
        name: '10A1',
        joinCode: 'ABC123',
        members: { create: [{ userId: waiting }, { userId: submitted }] },
      },
    });
    const soon = await prisma.assignment.create({
      data: {
        classId: klass.id,
        setId,
        mode: 'FLASHCARD',
        dueAt: new Date(Date.now() + 3 * 3_600_000),
      },
    });
    await prisma.assignment.create({
      data: {
        classId: klass.id,
        setId,
        mode: 'FLASHCARD',
        dueAt: new Date(Date.now() + 3 * DAY_MS),
      },
    });
    await prisma.assignmentSubmission.create({
      data: { assignmentId: soon.id, userId: submitted },
    });

    expect((await run().expect(200)).body.data).toEqual({ daily: 0, assignments: 1 });
    const note = await prisma.notification.findFirstOrThrow({ where: { userId: waiting } });
    expect(note).toMatchObject({
      type: 'ASSIGNMENT_DUE',
      href: `/classes/assignments/${soon.id}`,
      data: { setTitle: 'Unit 5' },
    });
    expect((await run().expect(200)).body.data.assignments).toBe(0);
  });
});
