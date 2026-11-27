import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { notificationListQuerySchema, type NotificationListQuery } from '@vocab/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Thông báo của tôi, mới nhất trước' })
  list(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: NotificationListQuery,
  ) {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc' })
  unreadCount(@CurrentUser() user: CurrentUserData) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  async markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    await this.notifications.markRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đánh dấu mọi thông báo đã đọc' })
  async markAllRead(@CurrentUser() user: CurrentUserData) {
    await this.notifications.markAllRead(user.id);
  }
}
