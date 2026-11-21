import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  MAX_CARDS_PER_SET,
  NO_FOLDER,
  SET_TITLE_MAX_LENGTH,
  type CardInput,
  type CreateSetDto,
  type PublicSetQuery,
  type ReplaceCardsDto,
  type Role,
  type UpdateSetDto,
  type MySetQuery,
} from '@vocab/shared';
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
  folderId: true,
  cardCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Khoá advisory của Postgres dành riêng cho job xoá hẳn bộ từ (việc 1.30). */
const PURGE_LOCK_KEY = 1_030;

const OWNER_NAME_SELECT = { owner: { select: { displayName: true } } } as const;

const CARD_SELECT = {
  id: true,
  position: true,
  term: true,
  definition: true,
  phonetic: true,
  example: true,
  imageUrl: true,
  audioUrl: true,
} as const;

/** Ghi 2.000 thẻ có thể lâu hơn mức mặc định 5 giây của transaction. */
const BULK_CARDS_TIMEOUT_MS = 30_000;
const COPY_TITLE_SUFFIX = ' (bản sao)';

type SetSummaryRow = Prisma.StudySetGetPayload<{ select: typeof SET_SUMMARY_SELECT }>;

export type AppendCardsResult =
  | { status: 'ok'; set: SetSummaryRow }
  | { status: 'limit'; current: number }
  | { status: 'not_found' };

export interface SetViewer {
  id: string;
  role: Role;
}

/**
 * Quyền xem nằm ngay trong truy vấn: không xem được thì coi như không tồn tại.
 * Bộ `CLASS` mở cho giáo viên và thành viên của lớp chưa lưu trữ đã được giao bộ đó;
 * rời lớp hay lớp bị lưu trữ là mất quyền xem ngay.
 */
export function visibleTo(viewer: SetViewer | null): Prisma.StudySetWhereInput {
  if (viewer?.role === 'ADMIN') {
    return {};
  }
  return {
    OR: [
      { visibility: 'PUBLIC', hiddenAt: null, owner: { deletedAt: null } },
      ...(viewer
        ? [
            { ownerId: viewer.id },
            {
              visibility: 'CLASS' as const,
              hiddenAt: null,
              owner: { deletedAt: null },
              assignments: {
                some: {
                  class: {
                    archivedAt: null,
                    OR: [{ teacherId: viewer.id }, { members: { some: { userId: viewer.id } } }],
                  },
                },
              },
            },
          ]
        : []),
    ],
  };
}

function toCopyTitle(title: string): string {
  const kept = title
    .slice(0, SET_TITLE_MAX_LENGTH - COPY_TITLE_SUFFIX.length)
    // Không để lại nửa ký tự khi cắt giữa emoji.
    .replace(/[\uD800-\uDBFF]$/, '')
    .trimEnd();
  return `${kept}${COPY_TITLE_SUFFIX}`;
}

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

  findByOwner(ownerId: string, { q, folderId, ...query }: MySetQuery) {
    const where: Prisma.StudySetWhereInput = {
      ownerId,
      deletedAt: null,
      ...(folderId ? { folderId: folderId === NO_FOLDER ? null : folderId } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };
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

  findPublic({ q, ...query }: PublicSetQuery) {
    const where: Prisma.StudySetWhereInput = {
      visibility: 'PUBLIC',
      deletedAt: null,
      hiddenAt: null,
      owner: { deletedAt: null },
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };
    return Promise.all([
      this.prisma.studySet.findMany({
        where,
        // Thư mục là thông tin riêng của chủ, không trả trong danh sách công khai.
        select: { ...SET_SUMMARY_SELECT, folderId: false, ...OWNER_NAME_SELECT },
        orderBy: toOrderBy(query.sort),
        ...toSkipTake(query),
      }),
      this.prisma.studySet.count({ where }),
    ]);
  }

  findVisibleById(id: string, viewer: SetViewer | null) {
    return this.prisma.studySet.findFirst({
      where: { id, deletedAt: null, ...visibleTo(viewer) },
      select: {
        ...SET_SUMMARY_SELECT,
        ...OWNER_NAME_SELECT,
        // Bộ bị ẩn chỉ chủ và ADMIN xem được, nên trạng thái ẩn không lộ cho người khác.
        hiddenAt: true,
        hiddenReason: true,
        cards: { select: CARD_SELECT, orderBy: { position: 'asc' } },
      },
    });
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

  /**
   * Bản sao luôn riêng tư, không kèm thư mục và tiến độ học.
   * Trả `null` nếu người gọi không xem được bộ gốc.
   */
  duplicate(id: string, viewer: SetViewer) {
    return this.prisma.$transaction(
      async (tx) => {
        const source = await tx.studySet.findFirst({
          where: { id, deletedAt: null, ...visibleTo(viewer) },
          select: {
            title: true,
            description: true,
            termLang: true,
            defLang: true,
            cards: {
              select: {
                position: true,
                term: true,
                definition: true,
                phonetic: true,
                example: true,
                imageUrl: true,
                audioUrl: true,
              },
            },
          },
        });
        if (!source) {
          return null;
        }

        const { cards, title, ...set } = source;
        const copy = await tx.studySet.create({
          data: {
            ...set,
            title: toCopyTitle(title),
            ownerId: viewer.id,
            visibility: 'PRIVATE',
            cardCount: cards.length,
          },
          select: SET_SUMMARY_SELECT,
        });
        await tx.card.createMany({ data: cards.map((card) => ({ ...card, setId: copy.id })) });
        return copy;
      },
      { timeout: BULK_CARDS_TIMEOUT_MS },
    );
  }

  /**
   * Giữ `id` của thẻ còn lại để không mất tiến độ học. Cập nhật bộ từ trước để khoá dòng,
   * nhờ đó hai lần lưu cùng lúc chạy lần lượt. Trả `null` nếu bộ từ không còn.
   */
  replaceCards(setId: string, { cards }: ReplaceCardsDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const { count } = await tx.studySet.updateMany({
          where: { id: setId, deletedAt: null },
          data: { cardCount: cards.length },
        });
        if (count === 0) {
          return null;
        }

        const existing = await tx.card.findMany({ where: { setId }, select: { id: true } });
        const existingIds = new Set(existing.map(({ id }) => id));
        const rows = cards.map(
          ({ id, term, definition, phonetic, example, imageUrl }, position) => ({
            id,
            position,
            term,
            definition,
            phonetic: phonetic ?? null,
            example: example ?? null,
            imageUrl: imageUrl ?? null,
            // Client cũ không gửi `imageUrl`: giữ ảnh đang có thay vì xoá.
            keepImage: imageUrl === undefined,
          }),
        );

        const unknown = rows.flatMap(({ id }, index) =>
          id && !existingIds.has(id)
            ? [
                {
                  path: `cards.${index}.id`,
                  code: 'not_in_set',
                  message: 'Thẻ không còn trong bộ từ',
                },
              ]
            : [],
        );
        if (unknown.length > 0) {
          throw new AppError(
            ERROR_CODES.CARD_NOT_IN_SET,
            'Có thẻ không thuộc bộ từ này. Hãy tải lại rồi thử lại.',
            HttpStatus.UNPROCESSABLE_ENTITY,
            unknown,
          );
        }

        const kept = rows.flatMap(({ id, ...row }) => (id ? [{ ...row, id }] : []));
        const keptIds = new Set(kept.map(({ id }) => id));
        const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
        if (removedIds.length > 0) {
          await tx.card.deleteMany({ where: { setId, id: { in: removedIds } } });
        }

        // Một câu lệnh cho mọi thẻ, chỉ ghi thẻ thật sự thay đổi.
        if (kept.length > 0) {
          await tx.$executeRaw`
            UPDATE "Card" AS card
            SET "position" = input."position",
                "term" = input."term",
                "definition" = input."definition",
                "phonetic" = input."phonetic",
                "example" = input."example",
                "imageUrl" = CASE WHEN input."keepImage" THEN card."imageUrl" ELSE input."imageUrl" END,
                "updatedAt" = now() AT TIME ZONE 'UTC'
            FROM unnest(
              ${kept.map(({ id }) => id)}::text[],
              ${kept.map(({ position }) => position)}::int[],
              ${kept.map(({ term }) => term)}::text[],
              ${kept.map(({ definition }) => definition)}::text[],
              ${kept.map(({ phonetic }) => phonetic)}::text[],
              ${kept.map(({ example }) => example)}::text[],
              ${kept.map(({ imageUrl }) => imageUrl)}::text[],
              ${kept.map(({ keepImage }) => keepImage)}::boolean[]
            ) AS input("id", "position", "term", "definition", "phonetic", "example", "imageUrl", "keepImage")
            WHERE card."id" = input."id"
              AND card."setId" = ${setId}
              AND (card."position", card."term", card."definition", card."phonetic", card."example", card."imageUrl")
                IS DISTINCT FROM
                (input."position", input."term", input."definition", input."phonetic", input."example",
                 CASE WHEN input."keepImage" THEN card."imageUrl" ELSE input."imageUrl" END)
          `;
        }

        const added = rows.filter(({ id }) => !id);
        if (added.length > 0) {
          await tx.card.createMany({
            data: added.map(({ id: _id, keepImage: _keep, ...row }) => ({ ...row, setId })),
          });
        }

        return tx.studySet.findUniqueOrThrow({
          where: { id: setId },
          select: {
            ...SET_SUMMARY_SELECT,
            cards: { select: CARD_SELECT, orderBy: { position: 'asc' } },
          },
        });
      },
      { timeout: BULK_CARDS_TIMEOUT_MS },
    );
  }

  /**
   * Thêm thẻ vào cuối bộ từ. Điều kiện số thẻ nằm trong cùng câu lệnh cập nhật `cardCount`,
   * nên hai lần nhập cùng lúc không thể vượt giới hạn.
   */
  appendCards(setId: string, cards: CardInput[]): Promise<AppendCardsResult> {
    return this.prisma.$transaction(
      async (tx): Promise<AppendCardsResult> => {
        const { count } = await tx.studySet.updateMany({
          where: {
            id: setId,
            deletedAt: null,
            cardCount: { lte: MAX_CARDS_PER_SET - cards.length },
          },
          data: { cardCount: { increment: cards.length } },
        });
        if (count === 0) {
          const set = await tx.studySet.findFirst({
            where: { id: setId, deletedAt: null },
            select: { cardCount: true },
          });
          return set ? { status: 'limit', current: set.cardCount } : { status: 'not_found' };
        }

        const last = await tx.card.aggregate({ where: { setId }, _max: { position: true } });
        const start = (last._max.position ?? -1) + 1;
        await tx.card.createMany({
          data: cards.map(({ term, definition, phonetic, example }, index) => ({
            setId,
            position: start + index,
            term,
            definition,
            phonetic: phonetic ?? null,
            example: example ?? null,
          })),
        });
        const set = await tx.studySet.findUniqueOrThrow({
          where: { id: setId },
          select: SET_SUMMARY_SELECT,
        });
        return { status: 'ok', set };
      },
      { timeout: BULK_CARDS_TIMEOUT_MS },
    );
  }

  /** Thư mục có thuộc người này không. */
  async folderOwnedBy(folderId: string, ownerId: string): Promise<boolean> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId },
      select: { id: true },
    });
    return folder !== null;
  }

  async findOwnerId(id: string): Promise<string | null> {
    const set = await this.prisma.studySet.findFirst({
      where: { id, deletedAt: null },
      select: { ownerId: true },
    });
    return set?.ownerId ?? null;
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

  /**
   * Xoá hẳn tối đa `limit` bộ từ đã xoá mềm trước `before`. Thẻ, phiên học và tiến độ
   * bị xoá theo cascade. Trả `null` khi instance khác đang giữ khoá của job này.
   */
  async purgeDeletedBefore(before: Date, limit: number): Promise<number | null> {
    return this.prisma.$transaction(async (tx) => {
      // Khoá tự nhả khi transaction kết thúc, nên không cần giữ một kết nối riêng.
      const [lock] = await tx.$queryRaw<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${PURGE_LOCK_KEY}::bigint) AS locked`;
      if (!lock?.locked) {
        return null;
      }
      const expired = await tx.studySet.findMany({
        where: { deletedAt: { lt: before } },
        select: { id: true },
        orderBy: { deletedAt: 'asc' },
        take: limit,
      });
      if (expired.length === 0) {
        return 0;
      }
      const { count } = await tx.studySet.deleteMany({
        where: { id: { in: expired.map(({ id }) => id) }, deletedAt: { lt: before } },
      });
      return count;
    });
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
