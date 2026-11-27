import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { startOfStudyWeek } from '@vocab/shared';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccessTokenService } from '../src/common/auth/access-token.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('Bảng xếp hạng', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let users: Record<'teacher' | 'ann' | 'bob' | 'cat' | 'out', { id: string; token: string }>;
  let classId: string;

  const server = () => request(app.getHttpServer());
  const get = (path: string, token: string) =>
    server().get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`);
  const createUser = async (name: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') => {
    const user = await prisma.user.create({
      data: { email: `${name}@example.com`, displayName: name, role },
    });
    return { id: user.id, token: await app.get(AccessTokenService).sign(user) };
  };
  const giveXp = (userId: string, amount: number, minutesIntoWeek = 60) =>
    prisma.xpEvent.create({
      data: {
        userId,
        amount,
        createdAt: new Date(startOfStudyWeek(new Date()).getTime() + minutesIntoWeek * 60_000),
      },
    });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    users = {
      teacher: await createUser('teacher', 'TEACHER'),
      ann: await createUser('ann'),
      bob: await createUser('bob'),
      cat: await createUser('cat'),
      out: await createUser('out'),
    };
    const created = await prisma.class.create({
      data: {
        teacherId: users.teacher.id,
        name: '10A1',
        joinCode: 'ABC123',
        members: { create: [{ userId: users.ann.id }, { userId: users.bob.id }] },
      },
    });
    classId = created.id;
    await giveXp(users.ann.id, 30, 30);
    await giveXp(users.bob.id, 50);
    await giveXp(users.cat.id, 30, 10);
    // XP tuần trước không tính vào tuần này.
    await giveXp(users.out.id, 999, -60);
  });

  afterAll(async () => {
    await app.close();
  });

  it('xếp theo XP tuần, bằng XP thì ai đạt sớm hơn đứng trên', async () => {
    const { body } = await get('/leaderboard', users.ann.token).expect(200);
    expect(body.data.entries).toEqual([
      { rank: 1, displayName: 'bob', xp: 50, isMe: false },
      { rank: 2, displayName: 'cat', xp: 30, isMe: false },
      { rank: 3, displayName: 'ann', xp: 30, isMe: true },
    ]);
    expect(body.data.me).toEqual({ rank: 3, displayName: 'ann', xp: 30, isMe: true });
    expect(body.data).toMatchObject({ hidden: false, enabled: true });
  });

  it('tuần trước chỉ tính XP của tuần trước', async () => {
    const { body } = await get('/leaderboard?week=previous', users.ann.token).expect(200);
    expect(body.data.entries).toEqual([{ rank: 1, displayName: 'out', xp: 999, isMe: false }]);
    expect(body.data.me).toBeNull();
  });

  it('ẩn tên khỏi bảng chung nhưng vẫn thấy hạng của mình và vẫn có trong bảng lớp', async () => {
    await server()
      .put('/api/v1/leaderboard/visibility')
      .set('Authorization', `Bearer ${users.bob.token}`)
      .send({ hidden: true })
      .expect(200);

    const other = await get('/leaderboard', users.ann.token).expect(200);
    expect(other.body.data.entries.map((e: { displayName: string }) => e.displayName)).toEqual([
      'cat',
      'ann',
    ]);
    const mine = await get('/leaderboard', users.bob.token).expect(200);
    expect(mine.body.data).toMatchObject({ hidden: true, me: { rank: 1, xp: 50 } });

    const inClass = await get(`/leaderboard/classes/${classId}`, users.ann.token).expect(200);
    expect(inClass.body.data.entries.map((e: { displayName: string }) => e.displayName)).toEqual([
      'bob',
      'ann',
    ]);
  });

  it('bảng lớp chỉ cho giáo viên và thành viên', async () => {
    await get(`/leaderboard/classes/${classId}`, users.teacher.token).expect(200);
    await get(`/leaderboard/classes/${classId}`, users.cat.token).expect(404);
    await get('/leaderboard/classes/khong-co', users.ann.token).expect(404);
  });

  it('giáo viên tắt bảng thì học sinh bị từ chối, giáo viên vẫn xem được', async () => {
    await server()
      .patch(`/api/v1/classes/${classId}`)
      .set('Authorization', `Bearer ${users.teacher.token}`)
      .send({ leaderboardEnabled: false })
      .expect(200);

    const denied = await get(`/leaderboard/classes/${classId}`, users.ann.token).expect(403);
    expect(denied.body.error.code).toBe('LEADERBOARD_DISABLED');
    const teacher = await get(`/leaderboard/classes/${classId}`, users.teacher.token).expect(200);
    expect(teacher.body.data.enabled).toBe(false);
  });

  it('tài khoản bị khoá không hiện trên bảng', async () => {
    await prisma.user.update({ where: { id: users.bob.id }, data: { lockedAt: new Date() } });
    const { body } = await get('/leaderboard', users.ann.token).expect(200);
    expect(body.data.entries[0].displayName).toBe('cat');
  });
});
