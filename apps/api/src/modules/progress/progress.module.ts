import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgeRepository } from './badge.repository';
import { BadgeService } from './badge.service';
import { StatsController } from './stats.controller';
import { StatsRepository } from './stats.repository';
import { StatsService } from './stats.service';
import { StreakRepository } from './streak.repository';
import { StreakService } from './streak.service';

@Module({
  imports: [NotificationsModule],
  controllers: [StatsController],
  providers: [
    StatsService,
    StatsRepository,
    StreakService,
    StreakRepository,
    BadgeService,
    BadgeRepository,
  ],
  exports: [StreakService, BadgeService],
})
export class ProgressModule {}
