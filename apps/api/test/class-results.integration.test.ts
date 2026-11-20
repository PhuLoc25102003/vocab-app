import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role, type StudyMode } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY = 24 * 60 * 60 * 1000;

describe('kết quả lớp', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let otherTeacher: { id: string; token: string };
  let admin: { id: string; token: string };
  let an: { id: string; token: string };
  let binh: { id: string; token: string };
  let chi: { id: string; token: string };
  let classId: string;
  let setId: string;
  let cardIds: string[];
  let assignmentId: string;

  const createUser = async (email: string, displayName: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const join = (userId: string, joinedAt: Date) =>
    prisma.classMember.create({ data: { classId, userId, joinedAt } });
  /** Phiên học xong kèm câu trả lời: `answers[i]` đúng hay sai cho thẻ thứ i. */
  const finish = async (
    userId: string,
    finishedAt: Date,
    answers: boolean[],
    mode: StudyMode = 'MCQ',
  ) =>
    prisma.studySession.create({
      data: {
        userId,
        setId,
        mode,
        startedAt: finishedAt,
        finishedAt,
        correct: answers.filter(Boolean).length,
        total: answers.length,
        attempts: {
          create: answers.map((isCorrect, index) => ({
            cardId: cardIds[index] ?? '',
            answer: isCorrect ? 'đúng' : 'sai',
            isCorrect,
            timeMs: 1000,
          })),
        },
      },
    });
  const get = (url: string, token = teacher.token) =>
    request(app.getHttpServer()).get(`/api/v1${url}`).set('Authorization', `Bearer ${token}`);
  const summaryUrl = () => `/classes/${classId}/assignments/${assignmentId}/summary`;
  const resultsUrl = () => `/classes/${classId}/assignments/${assignmentId}/results`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const now = Date.now();
    teacher = await createUser('gv@example.com', 'Cô Lan', 'TEACHER');
    otherTeacher = await createUser('gv2@example.com', 'Thầy Minh', 'TEACHER');
    admin = await createUser('admin@example.com', 'Quản trị', 'ADMIN');
    an = await createUser('an@example.com', 'An');
    binh = await createUser('binh@example.com', 'Bình');
    chi = await createUser('chi@example.com', 'Chi');
    classId = (
      await prisma.class.create({
        data: { teacherId: teacher.id, name: '10A1', joinCode: 'ABC234' },
      })
    ).id;
    await join(an.id, new Date(now - 10 * DAY));
    await join(binh.id, new Date(now - 9 * DAY));
    await join(chi.id, new Date(now - 8 * DAY));
    const set = await prisma.studySet.create({
      data: {
        ownerId: teacher.id,
        title: 'Unit 1',
        visibility: 'CLASS',
        cards: {
          create: [
            { position: 0, term: 'apple', definition: 'quả táo' },
            { position: 1, term: 'banana', definition: 'quả chuối' },
          ],
        },
      },
      include: { cards: { orderBy: { position: 'asc' } } },
    });
    setId = set.id;
    cardIds = set.cards.map(({ id }) => id);
    assignmentId = (
      await prisma.assignment.create({
        data: {
          classId,
          setId,
          mode: 'MCQ',
          dueAt: new Date(now - DAY),
          createdAt: new Date(now - 5 * DAY),
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập, học sinh và giáo viên khác không xem được', async () => {
    await request(app.getHttpServer()).get(`/api/v1${summaryUrl()}`).expect(401);
    await get(summaryUrl(), an.token).expect(403);
    await get(resultsUrl(), otherTeacher.token).expect(403);
    await get(`/classes/${classId}/members/${an.id}/results`, otherTeacher.token).expect(403);
  });

  it('tổng hợp cả lớp: đã làm, quá hạn, điểm trung bình và từ hay sai', async () => {
    const now = Date.now();
    await finish(an.id, new Date(now - 4 * DAY), [true, false]);
    await finish(an.id, new Date(now - 3 * DAY), [true, true]);
    await finish(binh.id, new Date(now - 2 * DAY), [false, false]);
    // Trước lúc giao và sai chế độ thì không tính.
    await finish(chi.id, new Date(now - 6 * DAY), [true, true]);
    await finish(chi.id, new Date(now - DAY), [true, true], 'WRITE');

    const response = await get(summaryUrl()).expect(200);

    expect(response.body.data).toEqual({
      memberCount: 3,
      doneCount: 2,
      overdueCount: 1,
      averageScore: 50,
      hardCards: [
        {
          cardId: cardIds[1],
          term: 'banana',
          definition: 'quả chuối',
          wrongCount: 2,
          attemptCount: 3,
        },
        {
          cardId: cardIds[0],
          term: 'apple',
          definition: 'quả táo',
          wrongCount: 1,
          attemptCount: 3,
        },
      ],
    });
  });

  it('chưa ai làm thì điểm trung bình là null và không có từ hay sai', async () => {
    const response = await get(summaryUrl(), admin.token).expect(200);

    expect(response.body.data).toMatchObject({
      memberCount: 3,
      doneCount: 0,
      overdueCount: 3,
      averageScore: null,
      hardCards: [],
    });
  });

  it('kết quả từng học sinh theo thứ tự vào lớp, điểm lấy lần tốt nhất', async () => {
    const now = Date.now();
    const first = new Date(now - 4 * DAY);
    await finish(an.id, first, [true, false]);
    await finish(an.id, new Date(now - 3 * DAY), [true, true]);

    const response = await get(`${resultsUrl()}?limit=2`).expect(200);

    expect(response.body.meta).toMatchObject({ total: 3, limit: 2 });
    expect(response.body.data).toEqual([
      {
        userId: an.id,
        displayName: 'An',
        status: 'done',
        completedAt: first.toISOString(),
        correct: 2,
        total: 2,
      },
      {
        userId: binh.id,
        displayName: 'Bình',
        status: 'overdue',
        completedAt: null,
        correct: null,
        total: null,
      },
    ]);
  });

  it('học sinh đã rời lớp không còn trong kết quả', async () => {
    await finish(binh.id, new Date(), [false, false]);
    await prisma.classMember.delete({ where: { classId_userId: { classId, userId: binh.id } } });

    const summary = await get(summaryUrl()).expect(200);
    const results = await get(resultsUrl()).expect(200);

    expect(summary.body.data).toMatchObject({ memberCount: 2, doneCount: 0, hardCards: [] });
    expect(results.body.data.map((row: { userId: string }) => row.userId)).toEqual([an.id, chi.id]);
  });

  it('bài giao không thuộc lớp hoặc bộ đã xoá trả 404', async () => {
    const otherClass = await prisma.class.create({
      data: { teacherId: teacher.id, name: '10A2', joinCode: 'XYZ567' },
    });
    const response = await get(
      `/classes/${otherClass.id}/assignments/${assignmentId}/summary`,
    ).expect(404);
    expect(response.body.error.code).toBe(ERROR_CODES.ASSIGNMENT_NOT_FOUND);

    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    await get(resultsUrl()).expect(404);
  });

  it('kết quả một học sinh qua các bài giao của lớp', async () => {
    const now = Date.now();
    const write = await prisma.assignment.create({
      data: { classId, setId, mode: 'WRITE', createdAt: new Date(now - 2 * DAY) },
    });
    const finishedAt = new Date(now - DAY);
    await finish(an.id, finishedAt, [true, false], 'WRITE');

    const response = await get(`/classes/${classId}/members/${an.id}/results`).expect(200);

    expect(response.body.meta).toMatchObject({ total: 2 });
    expect(response.body.data).toEqual([
      expect.objectContaining({ id: assignmentId, mode: 'MCQ', status: 'overdue', correct: null }),
      expect.objectContaining({
        id: write.id,
        setTitle: 'Unit 1',
        mode: 'WRITE',
        status: 'done',
        completedAt: finishedAt.toISOString(),
        correct: 1,
        total: 2,
      }),
    ]);
  });

  it('người không ở trong lớp trả 404, tham số sai trả 400', async () => {
    const outsider = await createUser('ngoai@example.com', 'Người ngoài');

    const response = await get(`/classes/${classId}/members/${outsider.id}/results`).expect(404);

    expect(response.body.error.code).toBe(ERROR_CODES.CLASS_MEMBER_NOT_FOUND);
    await get(`${resultsUrl()}?page=0`).expect(400);
  });

  it('xem một học sinh trong lớp: tên và ngày vào lớp, không lộ email', async () => {
    const response = await get(`/classes/${classId}/members/${an.id}`).expect(200);

    expect(response.body.data).toEqual({
      userId: an.id,
      displayName: 'An',
      joinedAt: expect.any(String),
    });
    await get(`/classes/${classId}/members/${an.id}`, otherTeacher.token).expect(403);
    await get(`/classes/${classId}/members/${teacher.id}`).expect(404);
  });
});
