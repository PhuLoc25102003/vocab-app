import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODES, type ForgotPasswordInput, type ResetPasswordInput } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';
import { parseCorsOrigins, type Env } from '../../config/env';
import { Mailer } from '../../infrastructure/mail/mailer';
import { UsersRepository } from '../users/users.repository';
import { PasswordService } from './password.service';
import { PasswordResetRepository } from './password-reset.repository';

const TOKEN_TTL_MINUTES = 30;
const SENT_MESSAGE =
  'Nếu email này có tài khoản, thư đặt lại mật khẩu sẽ tới trong vài phút. Hãy kiểm tra cả mục Spam.';

export const hashResetToken = (token: string) =>
  createHash('sha256').update(token).digest('base64url');

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly resets: PasswordResetRepository,
    private readonly passwords: PasswordService,
    private readonly mailer: Mailer,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Luôn trả cùng một thông báo để không lộ email nào có tài khoản. */
  async request({ email }: ForgotPasswordInput) {
    const account = await this.users.findCredentialsByEmail(email);
    if (account && !account.lockedAt) {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);
      await this.resets.replaceToken(account.id, hashResetToken(token), expiresAt);
      const link = `${this.webOrigin()}/reset-password?token=${token}`;
      try {
        await this.mailer.send({
          to: account.email,
          subject: 'Đặt lại mật khẩu Nhớ Từ',
          text: `Chào ${account.displayName},\n\nMở liên kết sau để đặt mật khẩu mới, liên kết dùng được một lần trong ${TOKEN_TTL_MINUTES} phút:\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua thư này.`,
          html: `<p>Chào ${escapeHtml(account.displayName)},</p><p>Bấm vào liên kết sau để đặt mật khẩu mới. Liên kết dùng được một lần trong ${TOKEN_TTL_MINUTES} phút.</p><p><a href="${link}">Đặt lại mật khẩu</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua thư này.</p>`,
        });
      } catch (error) {
        // Không báo lỗi cho người dùng để không lộ email có tài khoản.
        this.logger.error(`Gửi thư đặt lại mật khẩu thất bại: ${String(error)}`);
      }
    }
    return ok({ message: SENT_MESSAGE });
  }

  async reset({ token, password }: ResetPasswordInput) {
    const passwordHash = await this.passwords.hash(password);
    const done = await this.resets.resetPassword(hashResetToken(token), passwordHash, new Date());
    if (!done) {
      throw new AppError(
        ERROR_CODES.RESET_TOKEN_INVALID,
        'Liên kết đã hết hạn hoặc đã được dùng. Hãy yêu cầu liên kết mới.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return ok({ message: 'Đã đặt mật khẩu mới. Hãy đăng nhập lại.' });
  }

  private webOrigin(): string {
    const configured = this.config.get('WEB_ORIGIN', { infer: true });
    const [first] = parseCorsOrigins(this.config.get('CORS_ORIGINS', { infer: true }));
    return (configured || first || '').replace(/\/$/, '');
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
