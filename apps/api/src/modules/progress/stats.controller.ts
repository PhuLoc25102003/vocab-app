import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { updateDailyGoalSchema, type UpdateDailyGoalInput } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
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

  @Get('xp')
  @ApiOperation({ summary: 'Tổng XP, cấp độ, XP hôm nay và mục tiêu ngày' })
  xp(@CurrentUser() user: CurrentUserData) {
    return this.stats.xp(user);
  }

  @Put('xp/goal')
  @ApiOperation({ summary: 'Đổi mục tiêu XP mỗi ngày (10, 20 hoặc 50)' })
  @ApiZodBody(updateDailyGoalSchema)
  updateDailyGoal(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(updateDailyGoalSchema)) dto: UpdateDailyGoalInput,
  ) {
    return this.stats.updateDailyGoal(user, dto);
  }

  @Get('sets/:id/cards')
  @ApiOperation({ summary: 'Mức nhớ và ngày ôn tiếp theo của từng thẻ trong bộ' })
  cardProgress(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.stats.cardProgress(id, user);
  }

  @Get('sets/:id')
  @ApiOperation({ summary: 'Tiến độ của tôi trong một bộ từ' })
  setProgress(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.stats.setProgress(id, user);
  }
}
