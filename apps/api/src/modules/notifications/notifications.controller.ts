import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  notificationListQuerySchema,
  unsubscribeSchema,
  updateNotificationPrefsSchema,
  type NotificationListQuery,
  type UnsubscribeInput,
  type UpdateNotificationPrefsInput,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { Public } from '../../common/decorators/public.decorator';
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

  @Get('prefs')
  @ApiOperation({ summary: 'Cài đặt nhắc học theo loại và kênh' })
  async prefs(@CurrentUser() user: CurrentUserData) {
    return { data: await this.notifications.prefs(user.id) };
  }

  @Put('prefs')
  @ApiOperation({ summary: 'Bật tắt từng loại nhắc học theo kênh' })
  @ApiZodBody(updateNotificationPrefsSchema)
  updatePrefs(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(updateNotificationPrefsSchema)) dto: UpdateNotificationPrefsInput,
  ) {
    return this.notifications.updatePrefs(user.id, dto);
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

  @Post('unsubscribe')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Huỷ nhận mail nhắc học bằng token trong mail, không cần đăng nhập' })
  @ApiZodBody(unsubscribeSchema)
  async unsubscribe(@Body(new ZodValidationPipe(unsubscribeSchema)) dto: UnsubscribeInput) {
    await this.notifications.unsubscribe(dto.token);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đánh dấu mọi thông báo đã đọc' })
  async markAllRead(@CurrentUser() user: CurrentUserData) {
    await this.notifications.markAllRead(user.id);
  }
}
