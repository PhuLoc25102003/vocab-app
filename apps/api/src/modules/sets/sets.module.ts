import { PublicSetCacheModule } from './public-set-cache.module';
import { Module } from '@nestjs/common';
import { SetsController } from './sets.controller';
import { SetsRepository } from './sets.repository';
import { SetsPurgeService } from './sets-purge.service';
import { SetsService } from './sets.service';

@Module({
  imports: [PublicSetCacheModule],
  controllers: [SetsController],
  providers: [SetsService, SetsRepository, SetsPurgeService],
})
export class SetsModule {}
