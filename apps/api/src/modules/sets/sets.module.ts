import { Module } from '@nestjs/common';
import { SetsController } from './sets.controller';
import { SetsRepository } from './sets.repository';
import { SetsService } from './sets.service';

@Module({
  controllers: [SetsController],
  providers: [SetsService, SetsRepository],
})
export class SetsModule {}
