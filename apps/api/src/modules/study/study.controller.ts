import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { startSessionSchema, submitAnswersSchema } from '@vocab/shared';
import type { StartSessionDto, SubmitAnswersDto } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { StudyService } from './study.service';

@ApiTags('study')
@ApiBearerAuth()
@Controller('study/sessions')
export class StudyController {
  constructor(private readonly study: StudyService) {}

  @Post()
  @ApiOperation({ summary: 'Bắt đầu phiên học' })
  @ApiZodBody(startSessionSchema)
  start(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(startSessionSchema)) dto: StartSessionDto,
  ) {
    return this.study.start(user, dto);
  }

  @Post(':id/answers')
  @HttpCode(HttpStatus.OK)
  @CheckOwnership('session')
  @ApiOperation({ summary: 'Gửi đáp án theo lô và cập nhật lịch ôn' })
  @ApiZodBody(submitAnswersSchema)
  submitAnswers(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(submitAnswersSchema)) dto: SubmitAnswersDto,
  ) {
    return this.study.submitAnswers(id, user, dto);
  }

  @Patch(':id/finish')
  @CheckOwnership('session')
  @ApiOperation({ summary: 'Kết thúc phiên học và trả kết quả' })
  finish(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.study.finish(id, user.id);
  }
}
