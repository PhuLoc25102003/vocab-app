import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { loginSchema, registerSchema } from '@vocab/shared';
import type { LoginInput, RegisterInput } from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthThrottlerGuard, ONE_MINUTE_MS, REGISTER_LIMIT_PER_IP } from './auth-throttler.guard';
import { AuthService } from './auth.service';
import { RefreshCookie } from './refresh-cookie';

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
    const { body, refreshToken, refreshExpiresAt } = await this.auth.login(dto, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });
    this.refreshCookie.set(reply, refreshToken, refreshExpiresAt);
    return body;
  }
}
