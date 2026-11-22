import { PublicSetCacheModule } from '../sets/public-set-cache.module';
import { Module } from '@nestjs/common';
import { AdminClassesController } from './admin-classes.controller';
import { AdminClassesRepository } from './admin-classes.repository';
import { AdminClassesService } from './admin-classes.service';
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
  imports: [PublicSetCacheModule],
  controllers: [
    AdminUsersController,
    AdminSetsController,
    AdminClassesController,
    AdminStatsController,
  ],
  providers: [
    AdminUsersService,
    AdminUsersRepository,
    AdminSetsService,
    AdminSetsRepository,
    AdminClassesService,
    AdminClassesRepository,
    AdminStatsService,
    AdminStatsRepository,
  ],
})
export class AdminModule {}
