import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsRepository } from './stats.repository';
import { StatsService } from './stats.service';
import { StreakRepository } from './streak.repository';
import { StreakService } from './streak.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService, StatsRepository, StreakService, StreakRepository],
  exports: [StreakService],
})
export class ProgressModule {}
