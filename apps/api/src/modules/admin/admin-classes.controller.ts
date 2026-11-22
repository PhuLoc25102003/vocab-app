import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminClassesService } from './admin-classes.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/classes')
export class AdminClassesController {
  constructor(private readonly classesService: AdminClassesService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan toàn bộ lớp học của từng giáo viên và học sinh chưa có lớp' })
  getOverview() {
    return this.classesService.getOverview();
  }
}
