import { PublicSetCacheModule } from '../sets/public-set-cache.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersDataModule } from './users-data.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, UsersDataModule, PublicSetCacheModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
