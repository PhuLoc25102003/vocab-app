import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ERROR_CODES } from '@vocab/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HealthRepository } from '../src/modules/health/health.repository';
import { HealthService } from '../src/modules/health/health.service';

function createService(ping: () => Promise<unknown>): HealthService {
  return new HealthService({ ping } as unknown as HealthRepository);
}

describe('HealthService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('báo ok khi database trả lời', async () => {
    const service = createService(() => Promise.resolve());
    await expect(service.check()).resolves.toEqual({ status: 'ok', db: 'up' });
  });

  it('trả 503 với DB_UNAVAILABLE khi database lỗi', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const service = createService(() => Promise.reject(new Error('down')));

    const error = await service.check().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      code: ERROR_CODES.DB_UNAVAILABLE,
    });
  });
});
