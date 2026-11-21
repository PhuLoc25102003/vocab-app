import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ERROR_CODES, type HealthResponse } from '@vocab/shared';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly repository: HealthRepository) {}

  async check(): Promise<HealthResponse> {
    try {
      await this.repository.ping();
    } catch (error) {
      this.logger.error('Không truy vấn được database', error);
      throw new ServiceUnavailableException({
        code: ERROR_CODES.DB_UNAVAILABLE,
        message: 'Không kết nối được database',
      });
    }
    return { status: 'ok', db: 'up' };
  }
}
