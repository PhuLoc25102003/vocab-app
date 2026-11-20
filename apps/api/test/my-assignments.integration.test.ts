import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Role, StudyMode } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY = 24 * 60 * 60 * 1000;

describe('học sinh xem bài cần làm', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let student: { id: string; token: string };
  let classId: string;
  let setId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const createClass = async (name: string, archived = false) =>
    (
      await prisma.class.create({
        data: {
          teacherId: teacher.id,
          name,
          joinCode: name.padEnd(6, 'X').slice(0, 6).toUpperCase(),
          archivedAt: archived ? new Date() : null,
        },
      })
    ).id;
  const assign = (data: { classId?: string; mode?: StudyMode; dueAt?: Date | null; at?: Date }) =>
    prisma.assignment.create({
      data: {
        classId: data.classId ?? classId,
        setId,
        mode: data.mode ?? 'WRITE',
        dueAt: data.dueAt ?? null,
        createdAt: data.at ?? new Date(),
      },
    });
  const finishSession = (mode: StudyMode, finishedAt: Date) =>
    prisma.studySession.create({
      data: { userId: student.id, setId, mode, startedAt: finishedAt, finishedAt },
    });
  const list = (token = student.token, query = '') =>
    request(app.getHttpServer())
      .get(`/api/v1/classes/assignments${query}`)
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('gv@example.com', 'TEACHER');
    student = await createUser('hs@example.com');
    classId = await createClass('LOPA');
    await prisma.classMember.create({ data: { classId, userId: student.id } });
    setId = (
      await prisma.studySet.create({
        data: { ownerId: teacher.id, title: 'Unit 1', visibility: 'CLASS' },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập', async () => {
    await request(app.getHttpServer()).get('/api/v1/classes/assignments').expect(401);
  });

  it('báo lỗi khi tham số phân trang sai', async () => {
    await list(student.token, '?limit=500').expect(400);
  });

  it('trả bài của lớp đã tham gia kèm tên lớp, tên bộ và trạng thái', async () => {
    const now = Date.now();
    const pending = await assign({ mode: 'MCQ', dueAt: new Date(now + 2 * DAY) });
    const overdue = await assign({
      mode: 'MATCH',
      dueAt: new Date(now - DAY),
      at: new Date(now - 3 * DAY),
    });
    const done = await assign({ mode: 'WRITE', at: new Date(now - 2 * DAY) });
    const finishedAt = new Date(now - DAY);
    await finishSession('WRITE', finishedAt);

    const response = await list().expect(200);

    expect(response.body.meta).toMatchObject({ total: 3 });
    expect(response.body.data.map((item: { id: string }) => item.id)).toEqual([
      overdue.id,
      pending.id,
      done.id,
    ]);
    expect(response.body.data).toEqual([
      expect.objectContaining({ id: overdue.id, status: 'overdue', completedAt: null }),
      expect.objectContaining({
        id: pending.id,
        classId,
        className: 'LOPA',
        setId,
        setTitle: 'Unit 1',
        mode: 'MCQ',
        status: 'pending',
        completedAt: null,
      }),
      expect.objectContaining({
        id: done.id,
        status: 'done',
        completedAt: finishedAt.toISOString(),
      }),
    ]);
  });

  it('chỉ tính phiên học xong đúng chế độ và sau lúc giao', async () => {
    const assignedAt = new Date(Date.now() - DAY);
    await assign({ mode: 'WRITE', at: assignedAt });
    await finishSession('WRITE', new Date(assignedAt.getTime() - DAY));
    await finishSession('MCQ', new Date());
    await prisma.studySession.create({
      data: { userId: student.id, setId, mode: 'WRITE', startedAt: new Date() },
    });

    const response = await list().expect(200);

    expect(response.body.data[0]).toMatchObject({ status: 'pending', completedAt: null });
  });

  it('học xong sau hạn vẫn tính là đã làm', async () => {
    const now = Date.now();
    await assign({ mode: 'WRITE', dueAt: new Date(now - DAY), at: new Date(now - 3 * DAY) });
    await finishSession('WRITE', new Date(now - 1000));

    const response = await list().expect(200);

    expect(response.body.data[0]).toMatchObject({ status: 'done' });
  });

  it('không trả bài của lớp chưa tham gia, lớp đã lưu trữ, bộ đã xoá hoặc phiên của người khác', async () => {
    const otherClass = await createClass('LOPB');
    await assign({ classId: otherClass });
    const archivedClass = await createClass('LOPC', true);
    await prisma.classMember.create({ data: { classId: archivedClass, userId: student.id } });
    await assign({ classId: archivedClass });
    await assign({ mode: 'MCQ' });
    const other = await createUser('hs2@example.com');
    await prisma.studySession.create({
      data: { userId: other.id, setId, mode: 'MCQ', finishedAt: new Date() },
    });

    const mine = await list().expect(200);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0]).toMatchObject({ mode: 'MCQ', status: 'pending' });

    await prisma.studySet.update({ where: { id: setId }, data: { deletedAt: new Date() } });
    const afterDelete = await list().expect(200);
    expect(afterDelete.body).toMatchObject({ data: [], meta: { total: 0 } });
  });

  it('người chưa vào lớp nào nhận danh sách trống, kể cả giáo viên', async () => {
    await assign({});

    const response = await list(teacher.token).expect(200);

    expect(response.body).toMatchObject({ data: [], meta: { total: 0 } });
  });

  it('trạng thái theo bài nộp, bỏ lỡ lên đầu, đã nộp xuống cuối', async () => {
    const submitted = await assign({ dueAt: new Date(Date.now() + DAY) });
    const missed = await assign({ dueAt: new Date(Date.now() - DAY) });
    const started = await assign({ dueAt: new Date(Date.now() + 2 * DAY) });
    await prisma.assignmentSubmission.create({
      data: { assignmentId: submitted.id, userId: student.id, score: 80 },
    });
    await prisma.studySession.create({
      data: {
        userId: student.id,
        setId,
        mode: 'WRITE',
        assignmentId: started.id,
        finishedAt: new Date(),
      },
    });

    const response = await list().expect(200);

    expect(
      response.body.data.map(
        ({
          id,
          progressStatus,
          doneModes,
        }: {
          id: string;
          progressStatus: string;
          doneModes: number;
        }) => [id, progressStatus, doneModes],
      ),
    ).toEqual([
      [missed.id, 'missed', 0],
      [started.id, 'in_progress', 1],
      [submitted.id, 'submitted', 0],
    ]);
    expect(response.body.data[0].modes).toEqual(['WRITE']);
  });
});
