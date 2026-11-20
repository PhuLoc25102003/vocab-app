import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ERROR_CODES, type Role } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('giao bài cho lớp', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let teacher: { id: string; token: string };
  let otherTeacher: { id: string; token: string };
  let student: { id: string; token: string };
  let admin: { id: string; token: string };
  let classId: string;
  let classSetId: string;

  const createUser = async (email: string, role: Role = 'STUDENT') => {
    const user = await prisma.user.create({ data: { email, displayName: email, role } });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const createSet = async (ownerId: string, visibility: 'PRIVATE' | 'CLASS' | 'PUBLIC') =>
    (await prisma.studySet.create({ data: { ownerId, title: `Bộ ${visibility}`, visibility } })).id;
  const call = (method: 'get' | 'post' | 'delete', url: string, token: string) =>
    request(app.getHttpServer())[method](`/api/v1${url}`).set('Authorization', `Bearer ${token}`);
  const assign = (body: object, token = teacher.token) =>
    call('post', `/classes/${classId}/assignments`, token).send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    teacher = await createUser('gv@example.com', 'TEACHER');
    otherTeacher = await createUser('gv2@example.com', 'TEACHER');
    student = await createUser('hs@example.com');
    admin = await createUser('admin@example.com', 'ADMIN');
    classId = (
      await prisma.class.create({
        data: { teacherId: teacher.id, name: '10A1', joinCode: 'ABC234' },
      })
    ).id;
    classSetId = await createSet(teacher.id, 'CLASS');
  });

  afterAll(async () => {
    await app.close();
  });

  it('cần đăng nhập', async () => {
    await request(app.getHttpServer()).get(`/api/v1/classes/${classId}/assignments`).expect(401);
  });

  it('giáo viên giao bộ của mình kèm chế độ và hạn nộp', async () => {
    const response = await assign({
      setId: classSetId,
      mode: 'WRITE',
      dueAt: '2026-12-01T23:59:00+07:00',
    }).expect(201);

    expect(response.body.data).toMatchObject({
      classId,
      setId: classSetId,
      setTitle: 'Bộ CLASS',
      mode: 'WRITE',
      dueAt: '2026-12-01T16:59:00.000Z',
    });
  });

  it('không có hạn thì dueAt là null, danh sách xếp hạn gần nhất lên trước', async () => {
    await assign({ setId: classSetId, mode: 'FLASHCARD' }).expect(201);
    await assign({ setId: classSetId, mode: 'MCQ', dueAt: '2026-12-05T00:00:00Z' }).expect(201);
    await assign({ setId: classSetId, mode: 'WRITE', dueAt: '2026-12-01T00:00:00Z' }).expect(201);

    const response = await call('get', `/classes/${classId}/assignments`, teacher.token).expect(
      200,
    );

    expect(response.body.meta.total).toBe(3);
    // Bài mới ghi cả danh sách chế độ (5.10) để API nhiều chế độ đọc được.
    const stored = await prisma.assignment.findMany({
      where: { classId },
      select: { mode: true, modes: true },
    });
    expect(stored.every(({ mode, modes }) => modes.length === 1 && modes[0] === mode)).toBe(true);
    expect(response.body.data.map(({ mode }: { mode: string }) => mode)).toEqual([
      'WRITE',
      'MCQ',
      'FLASHCARD',
    ]);
    expect(response.body.data[2].dueAt).toBeNull();
  });

  it('bộ riêng tư cần đồng ý chia sẻ cho lớp, đồng ý thì bộ chuyển sang CLASS', async () => {
    const privateSet = await createSet(teacher.id, 'PRIVATE');

    const refused = await assign({ setId: privateSet, modes: ['FLASHCARD'] }).expect(422);
    expect(refused.body.error.code).toBe(ERROR_CODES.SET_NOT_SHAREABLE);
    expect(
      (await prisma.studySet.findUniqueOrThrow({ where: { id: privateSet } })).visibility,
    ).toBe('PRIVATE');

    await assign({ setId: privateSet, modes: ['FLASHCARD'], shareToClass: true }).expect(201);
    expect(
      (await prisma.studySet.findUniqueOrThrow({ where: { id: privateSet } })).visibility,
    ).toBe('CLASS');
  });

  it('giao nhiều chế độ theo thứ tự, từ chối trùng hoặc quá 5, Ghép cặp cần 2 thẻ', async () => {
    const response = await assign({
      setId: classSetId,
      modes: ['FLASHCARD', 'MCQ', 'WRITE'],
    }).expect(201);
    expect(response.body.data).toMatchObject({
      mode: 'FLASHCARD',
      modes: ['FLASHCARD', 'MCQ', 'WRITE'],
    });

    await assign({ setId: classSetId, modes: ['MCQ', 'MCQ'] }).expect(400);
    await assign({
      setId: classSetId,
      modes: ['FLASHCARD', 'MCQ', 'WRITE', 'CLOZE', 'DICTATION', 'LEARN'],
    }).expect(400);
    await assign({ setId: classSetId, modes: [] }).expect(400);
    const match = await assign({ setId: classSetId, modes: ['MATCH'] }).expect(422);
    expect(match.body.error.details[0].path).toBe('modes');
  });

  it('giáo viên không giao được bộ của người khác, ADMIN thì được', async () => {
    const othersSet = await createSet(otherTeacher.id, 'PUBLIC');

    const denied = await assign({ setId: othersSet, mode: 'FLASHCARD' }).expect(404);
    expect(denied.body.error.code).toBe(ERROR_CODES.SET_NOT_FOUND);
    await assign({ setId: othersSet, mode: 'FLASHCARD' }, admin.token).expect(201);
  });

  it('kiểm tra dữ liệu và quyền với lớp', async () => {
    await assign({ setId: classSetId, mode: 'KHONG_CO' }).expect(400);
    await assign({ setId: classSetId, mode: 'MCQ', dueAt: 'ngày mai' }).expect(400);
    await assign({ setId: classSetId, mode: 'MCQ' }, student.token).expect(403);
    await assign({ setId: classSetId, mode: 'MCQ' }, otherTeacher.token).expect(403);
    await call('get', `/classes/${classId}/assignments`, otherTeacher.token).expect(403);
  });

  it('huỷ bài giao, bài của lớp khác hoặc đã huỷ trả 404', async () => {
    const created = await assign({ setId: classSetId, mode: 'MCQ' }).expect(201);
    const id = created.body.data.id as string;

    await call('delete', `/classes/${classId}/assignments/${id}`, teacher.token).expect(204);

    const again = await call(
      'delete',
      `/classes/${classId}/assignments/${id}`,
      teacher.token,
    ).expect(404);
    expect(again.body.error.code).toBe(ERROR_CODES.ASSIGNMENT_NOT_FOUND);
    expect(await prisma.assignment.count()).toBe(0);
  });
});
