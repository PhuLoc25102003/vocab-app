import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT, type RedisClient } from '../../infrastructure/redis/redis-client';

/** Ngắn để tên chủ bộ từ đổi cũng chỉ cũ tối đa vài phút, kể cả khi lỡ một lần xoá cache. */
const TTL_SECONDS = 300;
const ERROR_LOG_INTERVAL_MS = 60_000;

const setKey = (id: string) => `set:public:${id}`;
const ownerKey = (ownerId: string) => `set:owner:${ownerId}`;

/** Bộ từ đã lưu cache, đọc lại từ JSON nên ngày giờ là chuỗi ISO như trong response. */
export interface CachedSet {
  ownerId: string;
  [field: string]: unknown;
}

/**
 * Cache bộ từ công khai cho người không phải chủ (việc 2.2). Thiếu Redis thì không cache.
 * Redis lỗi thì coi như không có cache và ghi log, API vẫn đọc database.
 */
@Injectable()
export class PublicSetCache {
  private readonly logger = new Logger(PublicSetCache.name);
  private lastErrorLogAt = 0;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClient | null) {}

  async get(id: string): Promise<CachedSet | null> {
    const [raw] = await this.run([['GET', setKey(id)]]);
    return typeof raw === 'string' ? (JSON.parse(raw) as CachedSet) : null;
  }

  async put(id: string, set: CachedSet): Promise<void> {
    await this.run([
      ['SET', setKey(id), JSON.stringify(set), 'EX', TTL_SECONDS],
      // Chỉ mục theo chủ để xoá hết bộ của một người khi họ đổi tên hoặc xoá tài khoản.
      ['SADD', ownerKey(set.ownerId), id],
      ['EXPIRE', ownerKey(set.ownerId), TTL_SECONDS],
    ]);
  }

  async invalidate(id: string): Promise<void> {
    await this.run([['DEL', setKey(id)]]);
  }

  async invalidateOwner(ownerId: string): Promise<void> {
    const [ids] = await this.run([['SMEMBERS', ownerKey(ownerId)]]);
    const keys = Array.isArray(ids) ? ids.map((id) => setKey(String(id))) : [];
    await this.run([['DEL', ownerKey(ownerId), ...keys]]);
  }

  private async run(commands: (string | number)[][]): Promise<unknown[]> {
    if (!this.redis) return [];
    try {
      return await this.redis.exec(commands);
    } catch (error) {
      const now = Date.now();
      if (now - this.lastErrorLogAt >= ERROR_LOG_INTERVAL_MS) {
        this.lastErrorLogAt = now;
        this.logger.warn(`Không gọi được Redis, bỏ qua cache bộ từ: ${String(error)}`);
      }
      return [];
    }
  }
}
