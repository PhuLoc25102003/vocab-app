import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES, type Role } from '@vocab/shared';
import { z } from 'zod';
import { durationToSeconds, type Env } from '../../config/env';
import { AppError } from '../errors/app-error';

const ALGORITHM = 'HS256';

const claimsSchema = z.object({ sub: z.string().min(1), tv: z.number().int() });
export type AccessTokenClaims = z.infer<typeof claimsSchema>;

export interface AccessTokenSubject {
  id: string;
  role: Role;
  tokenVersion: number;
}

export function unauthorizedError(): AppError {
  return new AppError(ERROR_CODES.UNAUTHORIZED, 'Bạn cần đăng nhập', HttpStatus.UNAUTHORIZED);
}

@Injectable()
export class AccessTokenService {
  private readonly secret: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Env, true>,
  ) {
    this.secret = config.get('JWT_ACCESS_SECRET', { infer: true });
    this.ttlSeconds = durationToSeconds(config.get('JWT_ACCESS_TTL', { infer: true }));
  }

  sign({ id, role, tokenVersion }: AccessTokenSubject): Promise<string> {
    return this.jwt.signAsync(
      { sub: id, role, tv: tokenVersion },
      { secret: this.secret, algorithm: ALGORITHM, expiresIn: this.ttlSeconds },
    );
  }

  async verify(token: string): Promise<AccessTokenClaims> {
    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync<object>(token, {
        secret: this.secret,
        algorithms: [ALGORITHM],
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AppError(
          ERROR_CODES.TOKEN_EXPIRED,
          'Phiên đăng nhập đã hết hạn',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw unauthorizedError();
    }

    const claims = claimsSchema.safeParse(payload);
    if (!claims.success) {
      throw unauthorizedError();
    }
    return claims.data;
  }
}
