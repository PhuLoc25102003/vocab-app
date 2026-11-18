import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Lớp cha của repository: chỉ repository được truy cập Prisma. */
export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}
}
