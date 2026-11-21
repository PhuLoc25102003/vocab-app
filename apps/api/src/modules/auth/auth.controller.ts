import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ERROR_CODES,
  forgotPasswordSchema,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_NONCE_COOKIE_PATH,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@vocab/shared';
import type {
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@vocab/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AppError } from '../../common/errors/app-error';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InvalidRefreshTokenError } from './auth-session.service';
import { AuthThrottlerGuard, RefreshThrottle, RegisterThrottle } from './auth-throttler.guard';
import { SkipApiRateLimit } from '../../common/decorators/skip-api-rate-limit.decorator';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { RefreshCookie, sessionClientOf } from './refresh-cookie';

function errorCodeOf(error: unknown): string {
  if (error instanceof HttpException) {
    const response: unknown = error.getResponse();
    if (typeof response === 'object' && response !== null && 'code' in response) {
      return String(response.code);
    }
  }
  return ERROR_CODES.INTERNAL_ERROR;
}

@ApiTags('auth')
@Controller('auth')
@SkipApiRateLimit()
@UseGuards(AuthThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @RegisterThrottle()
  @ApiOperation({ summary: 'Đăng ký bằng email và mật khẩu' })
  @ApiZodBody(registerSchema)
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput) {
    return this.auth.register(dto);
  }

  /** Giới hạn theo IP như đăng ký, mỗi lần gọi có thể gửi một thư. */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @RegisterThrottle()
  @ApiOperation({
    summary: 'Gửi thư đặt lại mật khẩu, trả cùng kết quả dù email có tồn tại hay không',
  })
  @ApiZodBody(forgotPasswordSchema)
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput) {
    return this.passwordReset.request(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RegisterThrottle()
  @ApiOperation({ summary: 'Đặt mật khẩu mới bằng token trong thư, kết thúc mọi phiên cũ' })
  @ApiZodBody(resetPasswordSchema)
  resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput) {
    return this.passwordReset.reset(dto);
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
    const result = await this.auth.login(dto, sessionClientOf(request));
    this.refreshCookie.set(reply, result.refreshToken, result.refreshExpiresAt);
    return result.body;
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle({ account: true })
  @ApiOperation({ summary: 'Đăng nhập bằng Google ID token' })
  @ApiZodBody(googleLoginSchema)
  async google(
    @Body(new ZodValidationPipe(googleLoginSchema)) dto: GoogleLoginInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    // Chặn trang lạ đăng nhập trình duyệt của nạn nhân vào tài khoản của kẻ tấn công.
    this.refreshCookie.assertTrustedOrigin(request);
    const result = await this.auth.loginWithGoogle(dto, sessionClientOf(request));
    this.refreshCookie.set(reply, result.refreshToken, result.refreshExpiresAt);
    return result.body;
  }

  /**
   * Nút Google ở chế độ redirect (mobile) POST form về đây từ `accounts.google.com`, nên không
   * kiểm tra `Origin` mà so `nonce` trong token với cookie do chính web đặt (chống login CSRF).
   * Luôn chuyển về `/login` của web: thành công thì web gọi refresh để lấy phiên, lỗi thì hiện mã lỗi.
   * Không dùng `ZodValidationPipe` vì lỗi phải thành trang chuyển hướng, không phải JSON.
   */
  @Public()
  @Post('google/redirect')
  @SkipThrottle({ account: true })
  @ApiOperation({ summary: 'Nhận kết quả đăng nhập Google ở chế độ redirect' })
  async googleRedirect(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const input = googleLoginSchema.safeParse(body);
    const nonce = request.cookies[GOOGLE_NONCE_COOKIE];
    void reply.clearCookie(GOOGLE_NONCE_COOKIE, { path: GOOGLE_NONCE_COOKIE_PATH });

    const target = new URLSearchParams();
    try {
      if (!input.success || !nonce) {
        throw new AppError(
          ERROR_CODES.GOOGLE_TOKEN_INVALID,
          'Không xác minh được tài khoản Google. Hãy thử lại.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.auth.loginWithGoogle(input.data, sessionClientOf(request), nonce);
      this.refreshCookie.set(reply, result.refreshToken, result.refreshExpiresAt);
      target.set('google', 'done');
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === ERROR_CODES.INTERNAL_ERROR) {
        this.logger.error(error);
      }
      target.set('google_error', code);
    }
    await reply.redirect(this.auth.webLoginUrl(target), HttpStatus.SEE_OTHER);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RefreshThrottle()
  @ApiOperation({ summary: 'Cấp access token mới bằng cookie refresh' })
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    this.refreshCookie.assertTrustedOrigin(request);
    try {
      const token = this.refreshCookie.read(request);
      const result = await this.auth.refresh(token, sessionClientOf(request));
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
