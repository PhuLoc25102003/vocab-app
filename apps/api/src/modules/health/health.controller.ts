import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@vocab/shared';
import { Public } from '../../common/decorators/public.decorator';
import { SkipApiRateLimit } from '../../common/decorators/skip-api-rate-limit.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
@SkipApiRateLimit()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Kiểm tra API và database' })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
