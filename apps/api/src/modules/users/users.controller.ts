import { Body, Controller, Get, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { updateAccountSchema } from '@vocab/shared';
import type { UpdateAccountInput } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ACCOUNT_THROTTLE, AuthThrottlerGuard } from '../auth/auth-throttler.guard';
import { RefreshCookie, sessionClientOf } from '../auth/refresh-cookie';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Xem thông tin tài khoản' })
  getMe(@CurrentUser() user: CurrentUserData) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ account: true })
  @Throttle(ACCOUNT_THROTTLE)
  @ApiOperation({ summary: 'Sửa tên hiển thị hoặc đổi mật khẩu' })
  @ApiZodBody(updateAccountSchema)
  async updateMe(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(updateAccountSchema)) dto: UpdateAccountInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { body, session } = await this.users.updateMe(user.id, dto, sessionClientOf(request));
    if (session) {
      this.refreshCookie.set(reply, session.refreshToken, session.refreshExpiresAt);
    }
    return body;
  }
}
