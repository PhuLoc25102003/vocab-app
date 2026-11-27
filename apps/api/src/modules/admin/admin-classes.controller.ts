import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { adminAssignClassSchema, type AdminAssignClassInput } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
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

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xếp một học sinh vào lớp, không cần mã tham gia' })
  @ApiZodBody(adminAssignClassSchema)
  assignStudent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminAssignClassSchema)) { userId }: AdminAssignClassInput,
  ) {
    return this.classesService.assignStudent(id, userId);
  }
}
