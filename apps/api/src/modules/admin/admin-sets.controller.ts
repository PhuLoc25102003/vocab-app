import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminHiddenSetQuerySchema,
  hideSetSchema,
  type AdminHiddenSetQuery,
  type HideSetDto,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminSetsService } from './admin-sets.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/sets')
export class AdminSetsController {
  constructor(private readonly sets: AdminSetsService) {}

  @Get('hidden')
  @ApiOperation({ summary: 'Danh sách bộ từ bị ẩn' })
  listHidden(@Query(new ZodValidationPipe(adminHiddenSetQuerySchema)) query: AdminHiddenSetQuery) {
    return this.sets.listHidden(query);
  }

  @Patch(':id/hide')
  @ApiOperation({ summary: 'Ẩn bộ từ vi phạm khỏi người khác' })
  @ApiZodBody(hideSetSchema)
  hide(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserData,
    @Body(new ZodValidationPipe(hideSetSchema)) { reason }: HideSetDto,
  ) {
    return this.sets.hide(id, admin.id, reason);
  }

  @Patch(':id/unhide')
  @ApiOperation({ summary: 'Bỏ ẩn bộ từ' })
  unhide(@Param('id') id: string) {
    return this.sets.unhide(id);
  }
}
