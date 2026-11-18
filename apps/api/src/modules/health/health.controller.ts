import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@vocab/shared';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
