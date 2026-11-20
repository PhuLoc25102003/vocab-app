import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  joinClassSchema,
  joinedClassListQuerySchema,
  myAssignmentListQuerySchema,
  type JoinClassInput,
  type Pagination,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AssignmentsService } from './assignments.service';
import { ClassMembersService } from './class-members.service';

/** Việc của người học trong lớp, mọi vai trò đã đăng nhập đều gọi được. */
@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassMembershipController {
  constructor(
    private readonly members: ClassMembersService,
    private readonly assignments: AssignmentsService,
  ) {}

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tham gia lớp bằng mã, tham gia lại không bị trùng' })
  @ApiZodBody(joinClassSchema)
  join(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(joinClassSchema)) dto: JoinClassInput,
  ) {
    return this.members.join(user.id, dto);
  }

  @Get('joined')
  @ApiOperation({ summary: 'Lớp tôi đã tham gia, không gồm lớp đã lưu trữ' })
  listJoined(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(joinedClassListQuerySchema)) query: Pagination,
  ) {
    return this.members.listJoined(user.id, query);
  }

  @Get('assignments')
  @ApiOperation({
    summary: 'Bài cần làm ở các lớp đã tham gia, kèm trạng thái đã làm, chưa làm, quá hạn',
  })
  listMyAssignments(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(myAssignmentListQuerySchema)) query: Pagination,
  ) {
    return this.assignments.listForMember(user.id, query);
  }

  @Delete(':id/members/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rời lớp' })
  leave(@Param('id') id: string, @CurrentUser() user: CurrentUserData): Promise<void> {
    return this.members.remove(id, user.id);
  }
}
