import { Injectable } from '@nestjs/common';
import type { Pagination } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const FOLDER_SELECT = {
  id: true,
  name: true,
  _count: { select: { sets: { where: { deletedAt: null } } } },
} as const;

interface FolderRow {
  id: string;
  name: string;
  _count: { sets: number };
}

function toFolder({ id, name, _count }: FolderRow) {
  return { id, name, setCount: _count.sets };
}

@Injectable()
export class FoldersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByOwner(ownerId: string, query: Pagination) {
    const [rows, total] = await Promise.all([
      this.prisma.folder.findMany({
        where: { ownerId },
        select: FOLDER_SELECT,
        orderBy: { name: 'asc' },
        ...toSkipTake(query),
      }),
      this.prisma.folder.count({ where: { ownerId } }),
    ]);
    return { items: rows.map(toFolder), total };
  }

  /** So sánh không phân biệt hoa thường. `exceptId` bỏ qua chính thư mục đang đổi tên. */
  async nameTaken(ownerId: string, name: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.folder.findFirst({
      where: {
        ownerId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  async create(ownerId: string, name: string) {
    const row = await this.prisma.folder.create({ data: { ownerId, name }, select: FOLDER_SELECT });
    return toFolder(row);
  }

  async rename(id: string, name: string) {
    const row = await this.prisma.folder.update({
      where: { id },
      data: { name },
      select: FOLDER_SELECT,
    });
    return toFolder(row);
  }

  /** Bộ từ trong thư mục được giữ lại, khoá ngoại tự đặt `folderId` về null. */
  async delete(id: string): Promise<void> {
    await this.prisma.folder.delete({ where: { id } });
  }
}
