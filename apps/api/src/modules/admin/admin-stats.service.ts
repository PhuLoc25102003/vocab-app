import { Injectable } from '@nestjs/common';
import { ok } from '../../common/base/pagination';
import { AdminStatsRepository } from './admin-stats.repository';

@Injectable()
export class AdminStatsService {
  constructor(private readonly stats: AdminStatsRepository) {}

  async overview() {
    return ok(await this.stats.count());
  }
}
