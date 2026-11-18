import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type CreateSetDto, type Pagination, type UpdateSetDto } from '@vocab/shared';
import { BaseRepository } from '../../common/base/base.repository';
import { toSkipTake } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const SORTABLE_FIELDS = ['updatedAt', 'createdAt', 'title'] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

const SET_SUMMARY_SELECT = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  termLang: true,
  defLang: true,
  visibility: true,
  cardCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toOrderBy(sort: string): Prisma.StudySetOrderByWithRelationInput[] {
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.replace(/^-/, '');
  if (!SORTABLE_FIELDS.includes(field as SortableField)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Dữ liệu không hợp lệ',
      HttpStatus.BAD_REQUEST,
      [{ path: 'sort', code: 'invalid_value', message: 'Không sắp xếp được theo trường này' }],
    );
  }
  // Thêm id để thứ tự không đổi giữa các trang khi giá trị trùng nhau.
  return [{ [field]: direction }, { id: 'asc' }];
}

@Injectable()
export class SetsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findByOwner(ownerId: string, query: Pagination) {
    const where = { ownerId, deletedAt: null };
    return Promise.all([
      this.prisma.studySet.findMany({
        where,
        select: SET_SUMMARY_SELECT,
        orderBy: toOrderBy(query.sort),
        ...toSkipTake(query),
      }),
      this.prisma.studySet.count({ where }),
    ]);
  }

  /** Bộ từ và thẻ được tạo cùng lúc, lỗi giữa chừng thì không còn dữ liệu dở dang. */
  create(ownerId: string, { cards, ...set }: CreateSetDto) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.studySet.create({
        data: { ...set, ownerId, cardCount: cards.length },
        select: SET_SUMMARY_SELECT,
      });
      await tx.card.createMany({
        data: cards.map((card, position) => ({ ...card, position, setId: created.id })),
      });
      return created;
    });
  }

  /** Trả `null` nếu bộ từ không tồn tại hoặc đã xoá mềm. */
  async update(id: string, data: UpdateSetDto) {
    const where = { id, deletedAt: null };
    const { count } = await this.prisma.studySet.updateMany({ where, data });
    if (count === 0) {
      return null;
    }
    return this.prisma.studySet.findFirst({ where, select: SET_SUMMARY_SELECT });
  }

  /** Trả `false` nếu bộ từ không tồn tại hoặc đã xoá mềm. */
  async softDelete(id: string): Promise<boolean> {
    const { count } = await this.prisma.studySet.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  }
}
