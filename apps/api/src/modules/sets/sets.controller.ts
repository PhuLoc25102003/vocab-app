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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createSetSchema,
  paginationSchema,
  publicSetQuerySchema,
  replaceCardsSchema,
  updateSetSchema,
} from '@vocab/shared';
import type {
  CreateSetDto,
  Pagination,
  PublicSetQuery,
  ReplaceCardsDto,
  UpdateSetDto,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser, OptionalUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { OptionalAuth, Public } from '../../common/decorators/public.decorator';
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

  // Phải khai báo trước `:id`.
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Tìm bộ từ công khai' })
  listPublic(@Query(new ZodValidationPipe(publicSetQuerySchema)) query: PublicSetQuery) {
    return this.sets.listPublic(query);
  }

  @OptionalAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Xem bộ từ kèm thẻ' })
  getById(@Param('id') id: string, @OptionalUser() viewer: CurrentUserData | null) {
    return this.sets.getById(id, viewer);
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

  @Put(':id/cards')
  @CheckOwnership('set')
  @ApiOperation({ summary: 'Lưu toàn bộ thẻ của bộ từ' })
  @ApiZodBody(replaceCardsSchema)
  replaceCards(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replaceCardsSchema)) dto: ReplaceCardsDto,
  ) {
    return this.sets.replaceCards(id, dto);
  }

  @Delete(':id')
  @CheckOwnership('set')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá mềm bộ từ' })
  remove(@Param('id') id: string): Promise<void> {
    return this.sets.remove(id);
  }
}
