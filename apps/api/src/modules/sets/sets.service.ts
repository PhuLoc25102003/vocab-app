import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  type CreateSetDto,
  type Pagination,
  type PublicSetQuery,
  type UpdateSetDto,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { SetsRepository, type SetViewer } from './sets.repository';

function setNotFound(): AppError {
  return new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
}

@Injectable()
export class SetsService {
  constructor(private readonly sets: SetsRepository) {}

  async listMine(ownerId: string, query: Pagination) {
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
    return ok(set);
  }

  async create(ownerId: string, dto: CreateSetDto) {
    return ok(await this.sets.create(ownerId, dto));
  }

  async update(id: string, dto: UpdateSetDto) {
    const set = await this.sets.update(id, dto);
    if (!set) {
      throw setNotFound();
    }
    return ok(set);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.sets.softDelete(id))) {
      throw setNotFound();
    }
  }
}
