import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import {
  DELETED_SET_RETENTION_DAYS,
  PURGE_BATCH_SIZE,
  SetsPurgeService,
} from '../src/modules/sets/sets-purge.service';
import { createTestApp } from './support/app';
import { resetDatabase } from './support/database';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-19T00:00:00.000Z');
const daysAgo = (days: number, extraMs = 0) => new Date(NOW.getTime() - days * DAY_MS - extraMs);

describe('Xoá hẳn bộ từ đã xoá mềm', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let purger: SetsPurgeService;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    purger = app.get(SetsPurgeService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const user = await prisma.user.create({
      data: { email: 'owner@example.com', displayName: 'Chủ bộ' },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /** Bộ từ có một thẻ, một phiên học, một lần trả lời và tiến độ của thẻ. */
  async function createSet(title: string, deletedAt: Date | null) {
    const set = await prisma.studySet.create({
      data: {
        ownerId: userId,
        title,
        deletedAt,
        cardCount: 1,
        cards: { create: { position: 0, term: 'apple', definition: 'quả táo' } },
      },
      include: { cards: true },
    });
    const cardId = set.cards[0]!.id;
    await prisma.cardProgress.create({ data: { userId, cardId } });
    await prisma.studySession.create({
      data: {
        userId,
        setId: set.id,
        mode: 'FLASHCARD',
        attempts: { create: { cardId, answer: 'known', isCorrect: true, timeMs: 900 } },
      },
    });
    return set.id;
  }

  it(`chỉ xoá bộ đã xoá mềm quá ${DELETED_SET_RETENTION_DAYS} ngày, kèm dữ liệu học`, async () => {
    const expired = await createSet('Quá hạn', daysAgo(DELETED_SET_RETENTION_DAYS, 1));
    const atCutoff = await createSet('Đúng mốc', daysAgo(DELETED_SET_RETENTION_DAYS));
    const recent = await createSet('Mới xoá', daysAgo(DELETED_SET_RETENTION_DAYS - 1));
    const active = await createSet('Đang dùng', null);

    await expect(purger.purge(NOW)).resolves.toBe(1);

    const remaining = await prisma.studySet.findMany({ select: { id: true } });
    expect(remaining.map(({ id }) => id).sort()).toEqual([atCutoff, recent, active].sort());
    expect(await prisma.card.count({ where: { setId: expired } })).toBe(0);
    expect(await prisma.studySession.count({ where: { setId: expired } })).toBe(0);
    expect(await prisma.card.count()).toBe(3);
    expect(await prisma.cardProgress.count()).toBe(3);
    expect(await prisma.attempt.count()).toBe(3);
    expect(await prisma.user.count()).toBe(1);

    await expect(purger.purge(NOW)).resolves.toBe(0);
  });

  it('xoá theo lô cho tới hết', async () => {
    const deletedAt = daysAgo(DELETED_SET_RETENTION_DAYS + 5);
    await prisma.studySet.createMany({
      data: Array.from({ length: PURGE_BATCH_SIZE + 3 }, (_, index) => ({
        ownerId: userId,
        title: `Bộ ${index}`,
        deletedAt,
      })),
    });

    await expect(purger.purge(NOW)).resolves.toBe(PURGE_BATCH_SIZE + 3);
    expect(await prisma.studySet.count()).toBe(0);
  });

  it('hai lần chạy cùng lúc không lỗi và không xoá trùng', async () => {
    const deletedAt = daysAgo(DELETED_SET_RETENTION_DAYS + 1);
    await Promise.all([1, 2, 3].map((index) => createSet(`Bộ ${index}`, deletedAt)));

    const counts = await Promise.all([purger.purge(NOW), purger.purge(NOW)]);

    expect(counts[0] + counts[1]).toBe(3);
    expect(await prisma.studySet.count()).toBe(0);
  });

  it('bỏ qua khi instance khác đang giữ khoá', async () => {
    await createSet('Quá hạn', daysAgo(DELETED_SET_RETENTION_DAYS + 1));

    const purged = await prisma.$transaction(async (tx) => {
      // Giả lập instance khác đang chạy job: giữ cùng khoá trong một transaction mở.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${1_030}::bigint)`;
      return purger.purge(NOW);
    });

    expect(purged).toBe(0);
    expect(await prisma.studySet.count()).toBe(1);
  });
});
