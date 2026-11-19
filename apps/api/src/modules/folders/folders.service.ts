import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type FolderInput, type Pagination } from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { FoldersRepository } from './folders.repository';

const NAME_TAKEN_MESSAGE = 'Bạn đã có thư mục tên này';

function nameTaken(): AppError {
  return new AppError(ERROR_CODES.FOLDER_NAME_TAKEN, NAME_TAKEN_MESSAGE, HttpStatus.CONFLICT, [
    { path: 'name', code: 'taken', message: NAME_TAKEN_MESSAGE },
  ]);
}

/** Lỗi trùng khoá duy nhất của Prisma, xảy ra khi hai yêu cầu cùng tên đến cùng lúc. */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'P2002';
}

@Injectable()
export class FoldersService {
  constructor(private readonly folders: FoldersRepository) {}

  async listMine(ownerId: string, query: Pagination) {
    const { items, total } = await this.folders.findByOwner(ownerId, query);
    return paginated(items, total, query);
  }

  async create(ownerId: string, { name }: FolderInput) {
    if (await this.folders.nameTaken(ownerId, name)) {
      throw nameTaken();
    }
    try {
      return ok(await this.folders.create(ownerId, name));
    } catch (error) {
      throw isUniqueViolation(error) ? nameTaken() : error;
    }
  }

  async rename(id: string, ownerId: string, { name }: FolderInput) {
    if (await this.folders.nameTaken(ownerId, name, id)) {
      throw nameTaken();
    }
    try {
      return ok(await this.folders.rename(id, name));
    } catch (error) {
      throw isUniqueViolation(error) ? nameTaken() : error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.folders.delete(id);
  }
}
