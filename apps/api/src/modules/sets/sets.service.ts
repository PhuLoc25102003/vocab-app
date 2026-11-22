import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  MAX_CARDS_PER_SET,
  type ImportCardsDto,
  type CreateSetDto,
  type PublicSetQuery,
  type ReplaceCardsDto,
  type UpdateSetDto,
  type MySetQuery,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { UploadsService } from '../uploads/uploads.service';
import { PublicSetCache } from './public-set-cache';
import { SetsRepository, type SetViewer } from './sets.repository';

function folderNotFound(): AppError {
  return new AppError(ERROR_CODES.FOLDER_NOT_FOUND, 'Không tìm thấy thư mục', HttpStatus.NOT_FOUND);
}

function setNotFound(): AppError {
  return new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
}

@Injectable()
export class SetsService {
  constructor(
    private readonly sets: SetsRepository,
    private readonly cache: PublicSetCache,
    private readonly uploads: UploadsService,
  ) {}

  async listMine(ownerId: string, query: MySetQuery) {
    const [items, total] = await this.sets.findByOwner(ownerId, query);
    return paginated(items, total, query);
  }

  async listPublic(query: PublicSetQuery) {
    const [items, total] = await this.sets.findPublic(query);
    return paginated(items, total, query);
  }

  async getById(id: string, viewer: SetViewer | null) {
    // Chủ bộ từ và ADMIN luôn đọc database để thấy thư mục và trạng thái mới nhất.
    if (viewer?.role !== 'ADMIN') {
      const cached = await this.cache.get(id);
      if (cached && cached.ownerId !== viewer?.id) {
        return ok(cached);
      }
    }
    const set = await this.sets.findVisibleById(id, viewer);
    if (!set) {
      throw setNotFound();
    }
    // Thư mục là thông tin riêng của chủ bộ từ.
    const { folderId: _folderId, ...rest } = set;
    // Chỉ cache bộ ai cũng xem được, bộ của lớp còn tuỳ người xem.
    if (set.visibility === 'PUBLIC' && set.hiddenAt === null) {
      await this.cache.put(id, rest);
    }
    return ok(viewer?.id === set.ownerId ? set : rest);
  }

  async create(ownerId: string, dto: CreateSetDto) {
    this.uploads.assertCardImages(dto.cards);
    return ok(await this.sets.create(ownerId, dto));
  }

  async duplicate(id: string, viewer: SetViewer) {
    const copy = await this.sets.duplicate(id, viewer);
    if (!copy) {
      throw setNotFound();
    }
    return ok(copy);
  }

  async update(id: string, dto: UpdateSetDto) {
    if (dto.folderId) {
      // ADMIN sửa bộ của người khác thì thư mục vẫn phải thuộc chủ bộ từ.
      const ownerId = await this.sets.findOwnerId(id);
      if (!ownerId) {
        throw setNotFound();
      }
      if (!(await this.sets.folderOwnedBy(dto.folderId, ownerId))) {
        throw folderNotFound();
      }
    }
    const set = await this.sets.update(id, dto).catch((error: unknown) => {
      // Thư mục bị xoá ngay giữa lúc kiểm tra và lưu.
      throw (error as { code?: unknown } | null)?.code === 'P2003' ? folderNotFound() : error;
    });
    if (!set) {
      throw setNotFound();
    }
    await this.cache.invalidate(id);
    return ok(set);
  }

  async replaceCards(id: string, dto: ReplaceCardsDto) {
    this.uploads.assertCardImages(dto.cards);
    const set = await this.sets.replaceCards(id, dto);
    if (!set) {
      throw setNotFound();
    }
    await this.cache.invalidate(id);
    return ok(set);
  }

  async importCards(id: string, { cards }: ImportCardsDto) {
    this.uploads.assertCardImages(cards);
    const result = await this.sets.appendCards(id, cards);
    if (result.status === 'not_found') {
      throw setNotFound();
    }
    if (result.status === 'limit') {
      const room = MAX_CARDS_PER_SET - result.current;
      throw new AppError(
        ERROR_CODES.SET_CARD_LIMIT,
        `Bộ từ đang có ${result.current} thẻ, chỉ thêm được ${room} thẻ nữa`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        { max: MAX_CARDS_PER_SET, current: result.current, adding: cards.length },
      );
    }
    await this.cache.invalidate(id);
    return ok({ ...result.set, imported: cards.length });
  }

  async remove(id: string): Promise<void> {
    if (!(await this.sets.softDelete(id))) {
      throw setNotFound();
    }
    await this.cache.invalidate(id);
  }
}
