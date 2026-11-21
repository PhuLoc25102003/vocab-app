import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { paginationSchema } from '@vocab/shared';
import type { Pagination } from '@vocab/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { StudyService } from './study.service';

@ApiTags('review')
@ApiBearerAuth()
@Controller('review')
export class ReviewController {
  constructor(private readonly study: StudyService) {}

  @Get('due')
  @ApiOperation({ summary: 'Các bộ từ có thẻ đến hạn ôn' })
  due(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(paginationSchema)) query: Pagination,
  ) {
    return this.study.listDueSets(user, query);
  }
}
