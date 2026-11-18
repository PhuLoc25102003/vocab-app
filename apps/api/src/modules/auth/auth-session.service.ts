import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenService,
  type AccessTokenSubject,
} from '../../common/auth/access-token.service';
import { durationToSeconds, type Env } from '../../config/env';
import { RefreshSessionRepository } from './refresh-session.repository';

const ALGORITHM = 'HS256';
const USER_AGENT_MAX_LENGTH = 500;

export interface SessionClient {
  userAgent?: string;
  ip: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
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
    const familyId = randomUUID();
    const sessionId = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid: sessionId, fam: familyId },
      { secret: this.refreshSecret, algorithm: ALGORITHM, expiresIn: this.refreshTtlSeconds },
    );

    await this.sessions.create({
      id: sessionId,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      userAgent: client.userAgent?.slice(0, USER_AGENT_MAX_LENGTH) ?? null,
      ip: client.ip,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken: await this.accessTokens.sign(user),
      refreshToken,
      refreshExpiresAt,
    };
  }
}
