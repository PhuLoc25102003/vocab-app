import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
  type PushSubscriptionInput,
  type PushUnsubscribeInput,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PushService } from './push.service';

@ApiTags('push')
@ApiBearerAuth()
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('config')
  @ApiOperation({ summary: 'Máy chủ có bật Web Push không và khoá công khai VAPID' })
  config() {
    return this.push.config();
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lưu đăng ký thông báo đẩy của trình duyệt này' })
  @ApiZodBody(pushSubscriptionSchema)
  async subscribe(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(pushSubscriptionSchema)) dto: PushSubscriptionInput,
  ) {
    await this.push.subscribe(user.id, dto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi thử thông báo đẩy tới mọi thiết bị của tôi' })
  sendTest(@CurrentUser() user: CurrentUserData) {
    return this.push.sendTest(user.id);
  }

  @Post('subscriptions/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Huỷ đăng ký thông báo đẩy của trình duyệt này' })
  @ApiZodBody(pushUnsubscribeSchema)
  async unsubscribe(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(pushUnsubscribeSchema)) dto: PushUnsubscribeInput,
  ) {
    await this.push.unsubscribe(user.id, dto.endpoint);
  }
}
