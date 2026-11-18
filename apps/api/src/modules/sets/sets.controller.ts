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
import { createSetSchema, paginationSchema, updateSetSchema } from '@vocab/shared';
import type { CreateSetDto, Pagination, UpdateSetDto } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SetsService } from './sets.service';

@ApiTags('sets')
@ApiBearerAuth()
@Controller('sets')
export class SetsController {
  constructor(private readonly sets: SetsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bộ từ của tôi' })
  listMine(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(paginationSchema)) query: Pagination,
  ) {
    return this.sets.listMine(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bộ từ kèm danh sách thẻ' })
  @ApiZodBody(createSetSchema)
  create(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(createSetSchema)) dto: CreateSetDto,
  ) {
    return this.sets.create(user.id, dto);
  }

  @Patch(':id')
  @CheckOwnership('set')
  @ApiOperation({ summary: 'Sửa thông tin bộ từ' })
  @ApiZodBody(updateSetSchema)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSetSchema)) dto: UpdateSetDto) {
    return this.sets.update(id, dto);
  }

  @Delete(':id')
  @CheckOwnership('set')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá mềm bộ từ' })
  remove(@Param('id') id: string): Promise<void> {
    return this.sets.remove(id);
  }
}
