import { Module } from '@nestjs/common';
import { AdminSetsController } from './admin-sets.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsRepository } from './admin-stats.repository';
import { AdminStatsService } from './admin-stats.service';
import { AdminSetsRepository } from './admin-sets.repository';
import { AdminSetsService } from './admin-sets.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersRepository } from './admin-users.repository';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminUsersController, AdminSetsController, AdminStatsController],
  providers: [
    AdminUsersService,
    AdminUsersRepository,
    AdminSetsService,
    AdminSetsRepository,
    AdminStatsService,
    AdminStatsRepository,
  ],
})
export class AdminModule {}
