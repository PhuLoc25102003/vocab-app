import { randomInt } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ERROR_CODES,
  JOIN_CODE_ALPHABET,
  JOIN_CODE_LENGTH,
  type ClassListQuery,
  type CreateClassInput,
  type UpdateClassInput,
} from '@vocab/shared';
import { ok, paginated } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { ClassesRepository } from './classes.repository';

/** 32^6 mã, trùng rất hiếm. Thử lại vài lần rồi báo lỗi thay vì lặp mãi. */
const JOIN_CODE_ATTEMPTS = 5;

export function generateJoinCode(): string {
  return Array.from(
    { length: JOIN_CODE_LENGTH },
    () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)],
  ).join('');
}

/** Ở bảng Class chỉ `joinCode` là khoá duy nhất có thể trùng. */
function isJoinCodeTaken(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'P2002';
}

@Injectable()
export class ClassesService {
  constructor(private readonly classes: ClassesRepository) {}

  async listTaught(teacherId: string, query: ClassListQuery) {
    const { items, total } = await this.classes.findByTeacher(teacherId, query);
    return paginated(items, total, query);
  }

  async get(id: string) {
    const found = await this.classes.findById(id);
    if (!found) {
      throw new AppError(ERROR_CODES.CLASS_NOT_FOUND, 'Không tìm thấy lớp', HttpStatus.NOT_FOUND);
    }
    return ok(found);
  }

  async create(teacherId: string, { name, description }: CreateClassInput) {
    const created = await this.withFreshJoinCode((joinCode) =>
      this.classes.create(teacherId, { name, description: description ?? null }, joinCode),
    );
    return ok(created);
  }

  async update(id: string, { name, description, archived }: UpdateClassInput) {
    const archivedAt = archived === undefined ? undefined : archived ? new Date() : null;
    return ok(await this.classes.update(id, { name, description, archivedAt }));
  }

  /** Mã cũ hết hiệu lực ngay, học sinh đã tham gia vẫn ở trong lớp. */
  async regenerateJoinCode(id: string) {
    return ok(await this.withFreshJoinCode((joinCode) => this.classes.update(id, { joinCode })));
  }

  private async withFreshJoinCode<T>(write: (joinCode: string) => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await write(generateJoinCode());
      } catch (error) {
        if (!isJoinCodeTaken(error) || attempt >= JOIN_CODE_ATTEMPTS) {
          throw error;
        }
      }
    }
  }
}
