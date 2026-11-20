import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

describe('schema lớp học', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const createUser = (email: string) => prisma.user.create({ data: { email, displayName: email } });

  /** Một lớp có một học sinh và một bài giao từ bộ của giáo viên. */
  const seedClass = async () => {
    const teacher = await prisma.user.create({
      data: { email: 'gv@example.com', displayName: 'Cô Lan', role: 'TEACHER' },
    });
    const student = await createUser('hs@example.com');
    const set = await prisma.studySet.create({
      data: { ownerId: teacher.id, title: 'Unit 1', visibility: 'CLASS' },
    });
    const klass = await prisma.class.create({
      data: {
        teacherId: teacher.id,
        name: '10A1',
        joinCode: 'ABC123',
        members: { create: { userId: student.id } },
        assignments: {
          create: { setId: set.id, mode: 'FLASHCARD', dueAt: new Date('2026-12-01T16:59:59Z') },
        },
      },
    });
    return { teacher, student, set, klass };
  };

  const counts = async () => ({
    classes: await prisma.class.count(),
    members: await prisma.classMember.count(),
    assignments: await prisma.assignment.count(),
  });

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lưu lớp với thành viên và bài giao', async () => {
    const { klass, student } = await seedClass();

    const saved = await prisma.class.findUniqueOrThrow({
      where: { joinCode: 'ABC123' },
      include: { members: true, assignments: true },
    });

    expect(saved.id).toBe(klass.id);
    expect(saved.archivedAt).toBeNull();
    expect(saved.members.map(({ userId }) => userId)).toEqual([student.id]);
    expect(saved.assignments[0]).toMatchObject({ mode: 'FLASHCARD' });
  });

  it('mã tham gia không trùng giữa các lớp', async () => {
    const { teacher } = await seedClass();

    await expect(
      prisma.class.create({ data: { teacherId: teacher.id, name: '10A2', joinCode: 'ABC123' } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('một học sinh không tham gia một lớp hai lần', async () => {
    const { klass, student } = await seedClass();

    await expect(
      prisma.classMember.create({ data: { classId: klass.id, userId: student.id } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('xoá học sinh chỉ xoá tư cách thành viên', async () => {
    const { student } = await seedClass();

    await prisma.user.delete({ where: { id: student.id } });

    expect(await counts()).toEqual({ classes: 1, members: 0, assignments: 1 });
  });

  it('xoá bộ từ thì bài giao bị xoá theo', async () => {
    const { set } = await seedClass();

    await prisma.studySet.delete({ where: { id: set.id } });

    expect(await counts()).toEqual({ classes: 1, members: 1, assignments: 0 });
  });

  it('xoá lớp hoặc giáo viên thì thành viên và bài giao bị xoá theo', async () => {
    const { klass } = await seedClass();
    await prisma.class.delete({ where: { id: klass.id } });
    expect(await counts()).toEqual({ classes: 0, members: 0, assignments: 0 });

    await resetDatabase(prisma);
    const { teacher } = await seedClass();
    await prisma.user.delete({ where: { id: teacher.id } });
    expect(await counts()).toEqual({ classes: 0, members: 0, assignments: 0 });
  });
});
