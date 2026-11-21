import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TeacherOverviewService } from './teacher-overview.service';

@ApiTags('teacher')
@ApiBearerAuth()
@Controller('teacher')
@Roles('TEACHER', 'ADMIN')
export class TeacherOverviewController {
  constructor(private readonly overview: TeacherOverviewService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Tổng quan giáo viên: ô số liệu, cần chú ý, sắp đến hạn, bài vừa nộp',
  })
  get(@CurrentUser() user: CurrentUserData) {
    return this.overview.get(user.id);
  }
}
