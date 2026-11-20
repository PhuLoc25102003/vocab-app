import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role, type StudyMode } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('học sinh làm và nộp bài giao nhiều chế độ', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let student: { id: string; token: string };
  let outsider: { id: string; token: string };
  let classId: string;
  let setId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const assign = async (modes: StudyMode[], dueAt: Date | null = null) =>
    (
      await prisma.assignment.create({
        data: { classId, setId, mode: modes[0] ?? 'FLASHCARD', modes, dueAt },
      })
    ).id;
  const finish = (assignmentId: string, mode: StudyMode, correct: number, total: number) =>
    prisma.studySession.create({
      data: {
        userId: student.id,
        setId,
        mode,
        assignmentId,
        correct,
        total,
        finishedAt: new Date(),
      },
    });
  const call = (method: 'get' | 'post', url: string, token = student.token) =>
    request(app.getHttpServer())[method](`/api/v1${url}`).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const teacher = await createUser('gv@example.com', 'TEACHER');
    student = await createUser('hs@example.com');
    outsider = await createUser('ngoai@example.com');
    classId = (
      await prisma.class.create({
        data: { teacherId: teacher.id, name: 'Lớp A', joinCode: 'LOPAAA' },
      })
    ).id;
    await prisma.classMember.create({ data: { classId, userId: student.id } });
    setId = (
      await prisma.studySet.create({
        data: {
          ownerId: teacher.id,
          title: 'Unit 1',
          visibility: 'CLASS',
          cardCount: 3,
          cards: {
            create: ['apple', 'pear', 'plum'].map((term, position) => ({
              term,
              definition: `nghĩa ${term}`,
              position,
            })),
          },
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('tiến độ từng chế độ, nộp khi xong hết, điểm là trung bình chế độ có chấm', async () => {
    const id = await assign(['FLASHCARD', 'MCQ', 'WRITE']);
    const before = await call('get', `/classes/assignments/${id}`).expect(200);
    expect(before.body.data).toMatchObject({
      className: 'Lớp A',
      setTitle: 'Unit 1',
      modes: ['FLASHCARD', 'MCQ', 'WRITE'],
      canSubmit: false,
      submission: null,
    });

    await finish(id, 'FLASHCARD', 3, 3);
    await finish(id, 'MCQ', 2, 3);
    await finish(id, 'MCQ', 3, 3);
    const early = await call('post', `/classes/assignments/${id}/submit`).expect(422);
    expect(early.body.error.code).toBe(ERROR_CODES.ASSIGNMENT_INCOMPLETE);

    await finish(id, 'WRITE', 1, 2);
    const ready = await call('get', `/classes/assignments/${id}`).expect(200);
    expect(ready.body.data.progress).toEqual([
      { mode: 'FLASHCARD', done: true, score: null },
      { mode: 'MCQ', done: true, score: 100 },
      { mode: 'WRITE', done: true, score: 50 },
    ]);
    expect(ready.body.data.canSubmit).toBe(true);

    const submitted = await call('post', `/classes/assignments/${id}/submit`).expect(201);
    expect(submitted.body.data).toMatchObject({ score: 75, late: false });
    const again = await call('post', `/classes/assignments/${id}/submit`).expect(409);
    expect(again.body.error.code).toBe(ERROR_CODES.ASSIGNMENT_ALREADY_SUBMITTED);
    const after = await call('get', `/classes/assignments/${id}`).expect(200);
    expect(after.body.data).toMatchObject({ canSubmit: false, submission: { score: 75 } });
  });

  it('nộp sau hạn vẫn nhận và đánh dấu trễ; người ngoài lớp không thấy bài', async () => {
    const id = await assign(['FLASHCARD'], new Date(Date.now() - 60_000));
    await finish(id, 'FLASHCARD', 3, 3);

    const response = await call('post', `/classes/assignments/${id}/submit`).expect(201);
    expect(response.body.data).toMatchObject({ score: null, late: true });

    const hidden = await call('get', `/classes/assignments/${id}`, outsider.token).expect(404);
    expect(hidden.body.error.code).toBe(ERROR_CODES.ASSIGNMENT_NOT_FOUND);
    await call('post', `/classes/assignments/${id}/submit`, outsider.token).expect(404);
  });

  it('phiên học gắn bài giao chỉ khi đúng bộ và chế độ của bài', async () => {
    const id = await assign(['MCQ']);

    const wrong = await call('post', '/study/sessions')
      .send({ setId, mode: 'WRITE', assignmentId: id })
      .expect(422);
    expect(wrong.body.error.details[0].path).toBe('mode');
    await call('post', '/study/sessions', outsider.token)
      .send({ setId, mode: 'MCQ', assignmentId: id })
      .expect(404);

    const started = await call('post', '/study/sessions')
      .send({ setId, mode: 'MCQ', assignmentId: id })
      .expect(201);
    const session = await prisma.studySession.findUniqueOrThrow({
      where: { id: started.body.data.session.id },
    });
    expect(session.assignmentId).toBe(id);
  });
});
