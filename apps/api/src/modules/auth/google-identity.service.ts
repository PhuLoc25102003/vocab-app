import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { displayNameSchema, emailSchema, ERROR_CODES } from '@vocab/shared';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { AppError } from '../../common/errors/app-error';
import type { Env } from '../../config/env';

/** Thư viện không có loại lỗi riêng khi không tải được khoá công khai của Google. */
const CERTS_UNAVAILABLE_PREFIX = 'Failed to retrieve verification certificates';

export interface GoogleIdentity {
  googleId: string;
  email: string;
  displayName: string;
}

function unavailableError(): AppError {
  return new AppError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    'Chưa đăng nhập bằng Google được lúc này. Hãy thử lại sau hoặc dùng email và mật khẩu.',
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}

function invalidTokenError(): AppError {
  return new AppError(
    ERROR_CODES.GOOGLE_TOKEN_INVALID,
    'Không xác minh được tài khoản Google. Hãy thử lại.',
    HttpStatus.UNAUTHORIZED,
  );
}

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();
  private readonly clientId: string;

  constructor(config: ConfigService<Env, true>) {
    this.clientId = config.get('GOOGLE_CLIENT_ID', { infer: true });
  }

  /**
   * Kiểm tra chữ ký, hạn dùng, nơi phát hành và token có được cấp cho app này không.
   * Có `nonce` thì token phải mang đúng nonce đó (luồng redirect, chống login CSRF).
   */
  async verify(credential: string, nonce?: string): Promise<GoogleIdentity> {
    if (!this.clientId) {
      throw unavailableError();
    }

    const payload = await this.readPayload(credential);
    const email = emailSchema.safeParse(payload?.email);
    const nonceMismatch = nonce !== undefined && payload?.nonce !== nonce;
    if (!payload?.sub || payload.email_verified !== true || !email.success || nonceMismatch) {
      throw invalidTokenError();
    }

    const name = displayNameSchema.safeParse(payload.name);
    return {
      googleId: payload.sub,
      email: email.data,
      displayName: name.success ? name.data : email.data.slice(0, email.data.indexOf('@')),
    };
  }

  private async readPayload(credential: string): Promise<TokenPayload | undefined> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      return ticket.getPayload();
    } catch (error) {
      if (error instanceof Error && error.message.startsWith(CERTS_UNAVAILABLE_PREFIX)) {
        throw unavailableError();
      }
      throw invalidTokenError();
    }
  }
}
