import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { loginSchema, registerSchema } from '@vocab/shared';
import type { LoginInput, RegisterInput } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InvalidRefreshTokenError, type SessionClient } from './auth-session.service';
import {
  AuthThrottlerGuard,
  ONE_MINUTE_MS,
  REFRESH_LIMIT_PER_IP,
  REGISTER_LIMIT_PER_IP,
} from './auth-throttler.guard';
import { AuthService } from './auth.service';
import { RefreshCookie } from './refresh-cookie';

function clientOf(request: FastifyRequest): SessionClient {
  return { userAgent: request.headers['user-agent'], ip: request.ip };
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @SkipThrottle({ account: true })
  @Throttle({ ip: { limit: REGISTER_LIMIT_PER_IP, ttl: ONE_MINUTE_MS } })
  @ApiOperation({ summary: 'Đăng ký bằng email và mật khẩu' })
  @ApiZodBody(registerSchema)
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiZodBody(loginSchema)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.auth.login(dto, clientOf(request));
    this.refreshCookie.set(reply, result.refreshToken, result.refreshExpiresAt);
    return result.body;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle({ account: true })
  @Throttle({ ip: { limit: REFRESH_LIMIT_PER_IP, ttl: ONE_MINUTE_MS } })
  @ApiOperation({ summary: 'Cấp access token mới bằng cookie refresh' })
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    this.refreshCookie.assertTrustedOrigin(request);
    try {
      const token = this.refreshCookie.read(request);
      const result = await this.auth.refresh(token, clientOf(request));
      this.refreshCookie.set(reply, result.refreshToken, result.refreshExpiresAt);
      return result.body;
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        this.refreshCookie.clear(reply);
      }
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle({ ip: true, account: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất khỏi thiết bị hiện tại' })
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logout(user.id, this.refreshCookie.read(request));
    this.refreshCookie.clear(reply);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle({ ip: true, account: true })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất khỏi mọi thiết bị' })
  async logoutAll(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logoutAll(user.id);
    this.refreshCookie.clear(reply);
  }
}
