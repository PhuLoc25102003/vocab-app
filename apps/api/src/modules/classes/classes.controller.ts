import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  assignmentListQuerySchema,
  assignmentResultListQuerySchema,
  memberResultListQuerySchema,
  createAssignmentSchema,
  type CreateAssignmentInput,
  classListQuerySchema,
  classMemberListQuerySchema,
  createClassSchema,
  updateClassSchema,
  type ClassListQuery,
  type CreateClassInput,
  type Pagination,
  type UpdateClassInput,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AssignmentsService } from './assignments.service';
import { ClassMembersService } from './class-members.service';
import { ClassResultsService } from './class-results.service';
import { ClassesService } from './classes.service';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@Roles('TEACHER', 'ADMIN')
export class ClassesController {
  constructor(
    private readonly classes: ClassesService,
    private readonly members: ClassMembersService,
    private readonly assignments: AssignmentsService,
    private readonly results: ClassResultsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lớp tôi dạy, mới tạo trước' })
  list(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(classListQuerySchema)) query: ClassListQuery,
  ) {
    return this.classes.listTaught(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo lớp, server sinh mã tham gia' })
  @ApiZodBody(createClassSchema)
  create(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(createClassSchema)) dto: CreateClassInput,
  ) {
    return this.classes.create(user.id, dto);
  }

  @Get(':id')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Chi tiết lớp' })
  get(@Param('id') id: string) {
    return this.classes.get(id);
  }

  @Patch(':id')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Sửa tên, mô tả, lưu trữ hoặc mở lại lớp' })
  @ApiZodBody(updateClassSchema)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClassSchema)) dto: UpdateClassInput,
  ) {
    return this.classes.update(id, dto);
  }

  @Post(':id/join-code')
  @HttpCode(HttpStatus.OK)
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Đổi mã tham gia, mã cũ hết hiệu lực' })
  regenerateJoinCode(@Param('id') id: string) {
    return this.classes.regenerateJoinCode(id);
  }

  @Get(':id/members')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Thành viên của lớp, ai vào trước đứng trước' })
  listMembers(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(classMemberListQuerySchema)) query: Pagination,
  ) {
    return this.members.listMembers(id, query);
  }

  @Delete(':id/members/:userId')
  @CheckOwnership('class')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá học sinh khỏi lớp' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    return this.members.remove(id, userId);
  }

  @Get(':id/assignments')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Bài đã giao cho lớp, hạn gần nhất lên trước' })
  listAssignments(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(assignmentListQuerySchema)) query: Pagination,
  ) {
    return this.assignments.list(id, query);
  }

  @Post(':id/assignments')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Giao bộ từ cho lớp kèm chế độ học và hạn nộp' })
  @ApiZodBody(createAssignmentSchema)
  createAssignment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(createAssignmentSchema)) dto: CreateAssignmentInput,
  ) {
    return this.assignments.create(id, user, dto);
  }

  @Delete(':id/assignments/:assignmentId')
  @CheckOwnership('class')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Huỷ bài giao' })
  removeAssignment(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<void> {
    return this.assignments.remove(id, assignmentId);
  }

  @Get(':id/assignments/:assignmentId/summary')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Số liệu cả lớp của bài giao: đã làm, quá hạn, điểm, từ hay sai' })
  assignmentSummary(@Param('id') id: string, @Param('assignmentId') assignmentId: string) {
    return this.results.summary(id, assignmentId);
  }

  @Get(':id/assignments/:assignmentId/results')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Kết quả từng học sinh của bài giao, ai vào lớp trước đứng trước' })
  assignmentResults(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Query(new ZodValidationPipe(assignmentResultListQuerySchema)) query: Pagination,
  ) {
    return this.results.assignmentResults(id, assignmentId, query);
  }

  @Get(':id/members/:userId/results')
  @CheckOwnership('class')
  @ApiOperation({ summary: 'Kết quả của một học sinh qua các bài giao của lớp' })
  memberResults(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query(new ZodValidationPipe(memberResultListQuerySchema)) query: Pagination,
  ) {
    return this.results.memberResults(id, userId, query);
  }
}
