import { Injectable } from '@nestjs/common';
import { ok } from '../../common/base/pagination';
import { AdminClassesRepository } from './admin-classes.repository';

@Injectable()
export class AdminClassesService {
  constructor(private readonly repository: AdminClassesRepository) {}

  async getOverview() {
    const overview = await this.repository.getClassesOverview();
    return ok(overview);
  }
}
