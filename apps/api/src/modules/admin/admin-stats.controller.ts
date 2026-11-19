import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminStatsService } from './admin-stats.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly stats: AdminStatsService) {}

  @Get()
  @ApiOperation({ summary: 'Số người dùng, tài khoản bị khoá, bộ từ, bộ bị ẩn' })
  overview() {
    return this.stats.overview();
  }
}
