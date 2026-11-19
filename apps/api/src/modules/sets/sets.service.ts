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
import { SetsRepository, type SetViewer } from './sets.repository';

function folderNotFound(): AppError {
  return new AppError(ERROR_CODES.FOLDER_NOT_FOUND, 'Không tìm thấy thư mục', HttpStatus.NOT_FOUND);
}

function setNotFound(): AppError {
  return new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
}

@Injectable()
export class SetsService {
  constructor(private readonly sets: SetsRepository) {}

  async listMine(ownerId: string, query: MySetQuery) {
    const [items, total] = await this.sets.findByOwner(ownerId, query);
    return paginated(items, total, query);
  }

  async listPublic(query: PublicSetQuery) {
    const [items, total] = await this.sets.findPublic(query);
    return paginated(items, total, query);
  }

  async getById(id: string, viewer: SetViewer | null) {
    const set = await this.sets.findVisibleById(id, viewer);
    if (!set) {
      throw setNotFound();
    }
    // Thư mục là thông tin riêng của chủ bộ từ.
    const { folderId: _folderId, ...rest } = set;
    return ok(viewer?.id === set.ownerId ? set : rest);
  }

  async create(ownerId: string, dto: CreateSetDto) {
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
    return ok(set);
  }

  async replaceCards(id: string, dto: ReplaceCardsDto) {
    const set = await this.sets.replaceCards(id, dto);
    if (!set) {
      throw setNotFound();
    }
    return ok(set);
  }

  async importCards(id: string, { cards }: ImportCardsDto) {
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
    return ok({ ...result.set, imported: cards.length });
  }

  async remove(id: string): Promise<void> {
    if (!(await this.sets.softDelete(id))) {
      throw setNotFound();
    }
  }
}
