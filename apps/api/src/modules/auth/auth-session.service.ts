import { createHash, randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES, type AuthUser } from '@vocab/shared';
import {
  AccessTokenService,
  type AccessTokenSubject,
} from '../../common/auth/access-token.service';
import { AppError } from '../../common/errors/app-error';
import { durationToSeconds, type Env } from '../../config/env';
import { RefreshSessionRepository, type NewRefreshSession } from './refresh-session.repository';

const ALGORITHM = 'HS256';
const USER_AGENT_MAX_LENGTH = 500;
/** Nhiều tab có thể gửi cùng một token gần như đồng thời, đó không phải dấu hiệu đánh cắp. */
const ROTATION_GRACE_MS = 10_000;

export interface SessionClient {
  userAgent?: string;
  ip: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/** Phiên không còn dùng được. Controller xoá cookie khi gặp lỗi này. */
export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super(
      ERROR_CODES.REFRESH_TOKEN_INVALID,
      'Phiên đăng nhập không còn hiệu lực',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

function refreshInProgressError(): AppError {
  return new AppError(
    ERROR_CODES.REFRESH_IN_PROGRESS,
    'Phiên đăng nhập đang được làm mới',
    HttpStatus.CONFLICT,
  );
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthSessionService {
  private readonly refreshSecret: string;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    private readonly accessTokens: AccessTokenService,
    private readonly sessions: RefreshSessionRepository,
    config: ConfigService<Env, true>,
  ) {
    this.refreshSecret = config.get('JWT_REFRESH_SECRET', { infer: true });
    this.refreshTtlSeconds = durationToSeconds(config.get('JWT_REFRESH_TTL', { infer: true }));
  }

  /** Đăng nhập mới mở một family token riêng. */
  async start(user: AccessTokenSubject, client: SessionClient): Promise<IssuedSession> {
    const { issued, record } = await this.issue(user, randomUUID(), client);
    await this.sessions.create(record);
    return issued;
  }

  async refresh(
    token: string | undefined,
    client: SessionClient,
  ): Promise<{ user: AuthUser; issued: IssuedSession }> {
    if (!token || !(await this.hasValidSignature(token))) {
      throw new InvalidRefreshTokenError();
    }

    const session = await this.sessions.findByTokenHash(hashRefreshToken(token));
    if (!session) {
      throw new InvalidRefreshTokenError();
    }
    if (session.revokedAt) {
      if (Date.now() - session.revokedAt.getTime() < ROTATION_GRACE_MS) {
        throw refreshInProgressError();
      }
      // Token đã xoay vòng lại xuất hiện: coi như bị lộ, thu hồi cả family.
      await this.sessions.deleteFamily(session.familyId);
      throw new InvalidRefreshTokenError();
    }
    if (session.expiresAt.getTime() <= Date.now() || session.user.deletedAt) {
      throw new InvalidRefreshTokenError();
    }

    const { deletedAt: _deletedAt, tokenVersion, ...user } = session.user;
    const { issued, record } = await this.issue(
      { id: user.id, role: user.role, tokenVersion },
      session.familyId,
      client,
    );
    if (!(await this.sessions.rotate(session.id, record))) {
      throw refreshInProgressError();
    }
    return { user, issued };
  }

  private async hasValidSignature(token: string): Promise<boolean> {
    try {
      await this.jwt.verifyAsync<object>(token, {
        secret: this.refreshSecret,
        algorithms: [ALGORITHM],
      });
      return true;
    } catch {
      return false;
    }
  }

  private async issue(
    user: AccessTokenSubject,
    familyId: string,
    client: SessionClient,
  ): Promise<{ issued: IssuedSession; record: NewRefreshSession }> {
    const sessionId = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid: sessionId, fam: familyId },
      { secret: this.refreshSecret, algorithm: ALGORITHM, expiresIn: this.refreshTtlSeconds },
    );

    return {
      issued: { accessToken: await this.accessTokens.sign(user), refreshToken, refreshExpiresAt },
      record: {
        id: sessionId,
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        familyId,
        userAgent: client.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
        ip: client.ip,
        expiresAt: refreshExpiresAt,
      },
    };
  }
}
