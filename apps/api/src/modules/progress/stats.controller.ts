import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Streak, số từ đã thuộc và từ hay sai' })
  overview(@CurrentUser() user: CurrentUserData) {
    return this.stats.overview(user);
  }

  @Get('sets/:id')
  @ApiOperation({ summary: 'Tiến độ của tôi trong một bộ từ' })
  setProgress(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.stats.setProgress(id, user);
  }
}
