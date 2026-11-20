import { RedisClient, type RedisCommand } from '../../src/infrastructure/redis/redis-client';

interface Entry {
  value: string;
  expiresAt: number | null;
}

/** Redis giả trong bộ nhớ, chỉ có các lệnh API dùng. Nhiều app dùng chung một bản để giả lập nhiều instance. */
export class FakeRedis extends RedisClient {
  private readonly data = new Map<string, Entry>();
  failing = false;
  now = () => Date.now();

  exec(commands: readonly RedisCommand[]): Promise<unknown[]> {
    if (this.failing) return Promise.reject(new Error('Redis không phản hồi'));
    return Promise.resolve(commands.map((command) => this.run(command.map(String))));
  }

  private live(key: string): Entry | undefined {
    const entry = this.data.get(key);
    if (entry?.expiresAt !== null && entry !== undefined && entry.expiresAt <= this.now()) {
      this.data.delete(key);
      return undefined;
    }
    return entry;
  }

  private run([name, key = '', ...args]: string[]): unknown {
    const entry = this.live(key);
    switch (name) {
      case 'GET':
        return entry?.value ?? null;
      case 'INCR': {
        const value = String(Number(entry?.value ?? 0) + 1);
        this.data.set(key, { value, expiresAt: entry?.expiresAt ?? null });
        return Number(value);
      }
      case 'PTTL':
        if (!entry) return -2;
        return entry.expiresAt === null ? -1 : entry.expiresAt - this.now();
      case 'PEXPIRE':
        if (!entry || (args[1] === 'NX' && entry.expiresAt !== null)) return 0;
        entry.expiresAt = this.now() + Number(args[0]);
        return 1;
      case 'SET': {
        if (args.includes('NX') && entry) return null;
        const px = args.indexOf('PX');
        const ex = args.indexOf('EX');
        const ttl = px > 0 ? Number(args[px + 1]) : ex > 0 ? Number(args[ex + 1]) * 1000 : null;
        this.data.set(key, {
          value: args[0] ?? '',
          expiresAt: ttl === null ? null : this.now() + ttl,
        });
        return 'OK';
      }
      case 'DEL':
        return [key, ...args].filter((item) => this.data.delete(item)).length;
      default:
        throw new Error(`FakeRedis chưa hỗ trợ ${name}`);
    }
  }
}
