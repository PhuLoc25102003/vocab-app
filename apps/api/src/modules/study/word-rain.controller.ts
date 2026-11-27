import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  wordRainHighScoreQuerySchema,
  wordRainScoreSchema,
  type WordRainHighScoreQuery,
  type WordRainScoreInput,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { WordRainService } from './word-rain.service';

@ApiTags('study')
@ApiBearerAuth()
@Controller()
export class WordRainController {
  constructor(private readonly wordRain: WordRainService) {}

  @Get('sets/:id/word-rain/high-score')
  @ApiOperation({ summary: 'Điểm cao nhất của tôi ở Mưa từ trong bộ này' })
  best(
    @Param('id') setId: string,
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(wordRainHighScoreQuerySchema)) query: WordRainHighScoreQuery,
  ) {
    return this.wordRain.best(user.id, setId, query.style);
  }

  @Post('study/sessions/:id/word-rain/score')
  @CheckOwnership('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lưu điểm một ván Mưa từ, trả điểm cao nhất và có phải kỷ lục' })
  @ApiZodBody(wordRainScoreSchema)
  saveScore(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(wordRainScoreSchema)) dto: WordRainScoreInput,
  ) {
    return this.wordRain.saveScore(id, dto);
  }
}
