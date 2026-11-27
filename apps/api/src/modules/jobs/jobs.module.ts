import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProgressModule } from '../progress/progress.module';
import { JobsController } from './jobs.controller';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';

@Module({
  imports: [NotificationsModule, ProgressModule],
  controllers: [JobsController],
  providers: [RemindersService, RemindersRepository],
})
export class JobsModule {}
