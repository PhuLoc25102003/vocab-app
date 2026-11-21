import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminUserQuerySchema,
  lockUserSchema,
  setUserRoleSchema,
  type AdminUserQuery,
  type LockUserDto,
  type SetUserRoleDto,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminUsersService } from './admin-users.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách người dùng, tìm theo email hoặc tên' })
  list(@Query(new ZodValidationPipe(adminUserQuerySchema)) query: AdminUserQuery) {
    return this.users.list(query);
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Khoá tài khoản và huỷ mọi phiên đăng nhập' })
  @ApiZodBody(lockUserSchema)
  lock(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserData,
    @Body(new ZodValidationPipe(lockUserSchema)) { reason }: LockUserDto,
  ) {
    return this.users.lock(id, admin.id, reason);
  }

  @Patch(':id/unlock')
  @ApiOperation({ summary: 'Mở khoá tài khoản' })
  unlock(@Param('id') id: string) {
    return this.users.unlock(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Đổi vai trò, ví dụ cấp quyền giáo viên' })
  @ApiZodBody(setUserRoleSchema)
  setRole(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserData,
    @Body(new ZodValidationPipe(setUserRoleSchema)) { role }: SetUserRoleDto,
  ) {
    return this.users.setRole(id, admin.id, role);
  }
}
