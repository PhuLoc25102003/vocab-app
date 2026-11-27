import { Injectable } from '@nestjs/common';
import type { WordRainStyle } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class WordRainRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findSession(id: string) {
    return this.prisma.studySession.findUnique({
      where: { id },
      select: { userId: true, setId: true, mode: true },
    });
  }

  findBest(userId: string, setId: string, style: WordRainStyle) {
    return this.prisma.gameHighScore.findUnique({
      where: { userId_setId_style: { userId, setId, style } },
      select: { score: true, wave: true },
    });
  }

  async saveBest(
    userId: string,
    setId: string,
    style: WordRainStyle,
    best: { score: number; wave: number },
  ): Promise<void> {
    await this.prisma.gameHighScore.upsert({
      where: { userId_setId_style: { userId, setId, style } },
      create: { userId, setId, style, ...best },
      update: best,
      select: { score: true },
    });
  }
}
