import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  leaderboardQuerySchema,
  leaderboardVisibilitySchema,
  type LeaderboardQuery,
  type LeaderboardVisibilityInput,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Bảng xếp hạng XP tuần của cả app' })
  global(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(leaderboardQuerySchema)) query: LeaderboardQuery,
  ) {
    return this.leaderboard.global(user, query);
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Bảng xếp hạng XP tuần của một lớp, cho giáo viên và thành viên' })
  forClass(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(leaderboardQuerySchema)) query: LeaderboardQuery,
  ) {
    return this.leaderboard.forClass(user, id, query);
  }

  @Put('visibility')
  @ApiOperation({ summary: 'Ẩn hoặc hiện tên tôi trên bảng xếp hạng chung' })
  @ApiZodBody(leaderboardVisibilitySchema)
  setVisibility(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(leaderboardVisibilitySchema)) dto: LeaderboardVisibilityInput,
  ) {
    return this.leaderboard.setVisibility(user, dto);
  }
}
