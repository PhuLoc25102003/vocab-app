import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type HiddenSet } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { AdminSetsRepository } from './admin-sets.repository';

function found(set: HiddenSet | null) {
  if (!set) {
    throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
  }
  return ok(set);
}

@Injectable()
export class AdminSetsService {
  constructor(private readonly sets: AdminSetsRepository) {}

  async hide(id: string, adminId: string, reason: string) {
    return found(
      await this.sets.setHidden(id, {
        hiddenAt: new Date(),
        hiddenReason: reason,
        hiddenById: adminId,
      }),
    );
  }

  async unhide(id: string) {
    return found(await this.sets.setHidden(id, null));
  }
}
