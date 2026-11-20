export type RedisCommand = readonly (string | number)[];

/**
 * Cổng tới Redis. `exec` chạy các lệnh trong một transaction (MULTI/EXEC)
 * và trả kết quả theo đúng thứ tự lệnh.
 */
export abstract class RedisClient {
  abstract exec(commands: readonly RedisCommand[]): Promise<unknown[]>;
}

/** Token DI, giá trị là `RedisClient` hoặc `null` khi chưa cấu hình Upstash. */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const UPSTASH_TIMEOUT_MS = 2_000;

/** Gọi Upstash qua REST nên không giữ kết nối TCP, hợp với Render gói Free hay ngủ. */
export class UpstashRedisClient extends RedisClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {
    super();
  }

  async exec(commands: readonly RedisCommand[]): Promise<unknown[]> {
    const response = await fetch(`${this.url.replace(/\/$/, '')}/multi-exec`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Upstash trả ${response.status}`);
    }
    const replies = (await response.json()) as { result?: unknown; error?: string }[];
    return replies.map((reply) => {
      if (reply.error) throw new Error(`Upstash báo lỗi: ${reply.error}`);
      return reply.result;
    });
  }
}
