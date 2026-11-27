import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { PushController } from './push.controller';
import { PushRepository } from './push.repository';
import { PushService } from './push.service';

@Module({
  controllers: [NotificationsController, PushController],
  providers: [NotificationsService, NotificationsRepository, PushService, PushRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
