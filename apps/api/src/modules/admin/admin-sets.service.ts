import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, type AdminHiddenSetQuery, type HiddenSet } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { PublicSetCache } from '../sets/public-set-cache';
import { AdminSetsRepository } from './admin-sets.repository';

function found(set: HiddenSet | null) {
  if (!set) {
    throw new AppError(ERROR_CODES.SET_NOT_FOUND, 'Không tìm thấy bộ từ', HttpStatus.NOT_FOUND);
  }
  return ok(set);
}

@Injectable()
export class AdminSetsService {
  constructor(
    private readonly sets: AdminSetsRepository,
    private readonly cache: PublicSetCache,
  ) {}

  async listHidden(query: AdminHiddenSetQuery) {
    return this.sets.listHidden(query);
  }

  async hide(id: string, adminId: string, reason: string) {
    const set = await this.sets.setHidden(id, {
      hiddenAt: new Date(),
      hiddenReason: reason,
      hiddenById: adminId,
    });
    await this.cache.invalidate(id);
    return found(set);
  }

  async unhide(id: string) {
    const set = await this.sets.setHidden(id, null);
    await this.cache.invalidate(id);
    return found(set);
  }
}
