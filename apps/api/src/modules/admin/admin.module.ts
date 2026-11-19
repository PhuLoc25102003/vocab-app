import { Module } from '@nestjs/common';
import { AdminSetsController } from './admin-sets.controller';
import { AdminSetsRepository } from './admin-sets.repository';
import { AdminSetsService } from './admin-sets.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersRepository } from './admin-users.repository';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminUsersController, AdminSetsController],
  providers: [AdminUsersService, AdminUsersRepository, AdminSetsService, AdminSetsRepository],
})
export class AdminModule {}
