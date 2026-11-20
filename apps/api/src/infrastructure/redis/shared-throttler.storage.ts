import { Logger, type OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorageService, type ThrottlerStorage } from '@nestjs/throttler';
import type { RedisClient } from './redis-client';

type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

const KEY_PREFIX = 'rl';
const ERROR_LOG_INTERVAL_MS = 60_000;

const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

/**
 * Bộ đếm rate limit dùng chung giữa các instance qua Redis, theo cửa sổ cố định `ttl`.
 * Không có Redis thì đếm trong bộ nhớ. Redis lỗi thì đếm tạm trong bộ nhớ và ghi log,
 * để API vẫn chạy.
 */
export class SharedThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(SharedThrottlerStorage.name);
  private readonly local = new ThrottlerStorageService();
  private lastErrorLogAt = 0;

  constructor(private readonly redis: RedisClient | null) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.redis) {
      return this.local.increment(key, ttl, limit, blockDuration, throttlerName);
    }
    try {
      return await this.incrementShared(this.redis, key, ttl, limit, blockDuration, throttlerName);
    } catch (error) {
      this.logError(error);
      return this.local.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown(): void {
    this.local.onApplicationShutdown();
  }

  private async incrementShared(
    redis: RedisClient,
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `${KEY_PREFIX}:${throttlerName}:${key}`;
    const blockKey = `${hitsKey}:block`;
    const [blockLeft, hits, , hitsLeft] = (await redis.exec([
      ['PTTL', blockKey],
      ['INCR', hitsKey],
      ['PEXPIRE', hitsKey, ttl, 'NX'],
      ['PTTL', hitsKey],
    ])) as [number, number, number, number];
    const record = { totalHits: hits, timeToExpire: seconds(hitsLeft) };

    if (blockLeft > 0) {
      return { ...record, isBlocked: true, timeToBlockExpire: seconds(blockLeft) };
    }
    if (hits <= limit) {
      return { ...record, isBlocked: false, timeToBlockExpire: 0 };
    }
    // Không có thời gian chặn riêng thì chặn tới hết cửa sổ hiện tại.
    if (blockDuration <= 0) {
      return { ...record, isBlocked: true, timeToBlockExpire: seconds(hitsLeft) };
    }
    await redis.exec([['SET', blockKey, '1', 'PX', blockDuration, 'NX']]);
    return { ...record, isBlocked: true, timeToBlockExpire: seconds(blockDuration) };
  }

  /** Mỗi phút ghi tối đa một dòng để Redis sập không làm ngập log. */
  private logError(error: unknown): void {
    const now = Date.now();
    if (now - this.lastErrorLogAt < ERROR_LOG_INTERVAL_MS) return;
    this.lastErrorLogAt = now;
    this.logger.warn(`Không gọi được Redis, tạm đếm rate limit trong bộ nhớ: ${String(error)}`);
  }
}
