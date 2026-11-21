import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpstashRedisClient } from '../src/infrastructure/redis/redis-client';
import { SharedThrottlerStorage } from '../src/infrastructure/redis/shared-throttler.storage';
import { FakeRedis } from './support/fake-redis';

describe('SharedThrottlerStorage', () => {
  it('đếm theo cửa sổ, chặn khi vượt giới hạn rồi mở lại sau thời gian chặn', async () => {
    const redis = new FakeRedis();
    let now = 1_000_000;
    redis.now = () => now;
    const storage = new SharedThrottlerStorage(redis);
    const hit = () => storage.increment('k', 60_000, 2, 30_000, 'ip');

    expect(await hit()).toEqual({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    await hit();
    expect(await hit()).toMatchObject({ totalHits: 3, isBlocked: true, timeToBlockExpire: 30 });

    now += 10_000;
    expect(await hit()).toMatchObject({ isBlocked: true, timeToBlockExpire: 20 });

    now += 60_000;
    expect(await hit()).toMatchObject({ totalHits: 1, isBlocked: false });
  });

  it('không có thời gian chặn thì chặn tới hết cửa sổ', async () => {
    const storage = new SharedThrottlerStorage(new FakeRedis());

    await storage.increment('k', 60_000, 1, 0, 'ip');

    expect(await storage.increment('k', 60_000, 1, 0, 'ip')).toMatchObject({
      isBlocked: true,
      timeToBlockExpire: 60,
    });
  });

  it('không có Redis thì dùng bộ đếm trong bộ nhớ', async () => {
    const storage = new SharedThrottlerStorage(null);

    await storage.increment('k', 60_000, 1, 60_000, 'ip');

    expect(await storage.increment('k', 60_000, 1, 60_000, 'ip')).toMatchObject({
      isBlocked: true,
    });
    storage.onApplicationShutdown();
  });
});

describe('UpstashRedisClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gửi lệnh tới /multi-exec kèm token và trả kết quả theo thứ tự', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: 1 }, { result: 'OK' }]), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const client = new UpstashRedisClient('https://redis.example.com/', 'bi-mat');
    const replies = await client.exec([
      ['INCR', 'a'],
      ['SET', 'b', '1', 'PX', 1000],
    ]);

    expect(replies).toEqual([1, 'OK']);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://redis.example.com/multi-exec');
    expect(init.headers).toMatchObject({ authorization: 'Bearer bi-mat' });
    expect(JSON.parse(String(init.body))).toEqual([
      ['INCR', 'a'],
      ['SET', 'b', '1', 'PX', 1000],
    ]);
  });

  it('báo lỗi khi Upstash trả mã lỗi hoặc một lệnh lỗi', async () => {
    const client = new UpstashRedisClient('https://redis.example.com', 'bi-mat');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    await expect(client.exec([['GET', 'a']])).rejects.toThrow('Upstash trả 401');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify([{ error: 'WRONGTYPE' }]))),
    );
    await expect(client.exec([['INCR', 'a']])).rejects.toThrow('WRONGTYPE');
  });
});
