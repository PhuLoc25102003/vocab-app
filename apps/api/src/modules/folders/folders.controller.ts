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
  folderInputSchema,
  folderListQuerySchema,
  type FolderInput,
  type Pagination,
} from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CheckOwnership } from '../../common/decorators/check-ownership.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FoldersService } from './folders.service';

@ApiTags('folders')
@ApiBearerAuth()
@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  @ApiOperation({ summary: 'Thư mục của tôi, xếp theo tên' })
  list(
    @CurrentUser() user: CurrentUserData,
    @Query(new ZodValidationPipe(folderListQuerySchema)) query: Pagination,
  ) {
    return this.folders.listMine(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo thư mục' })
  @ApiZodBody(folderInputSchema)
  create(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(folderInputSchema)) dto: FolderInput,
  ) {
    return this.folders.create(user.id, dto);
  }

  @Patch(':id')
  @CheckOwnership('folder')
  @ApiOperation({ summary: 'Đổi tên thư mục' })
  @ApiZodBody(folderInputSchema)
  rename(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(folderInputSchema)) dto: FolderInput,
  ) {
    return this.folders.rename(id, user.id, dto);
  }

  @Delete(':id')
  @CheckOwnership('folder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá thư mục, bộ từ bên trong được giữ lại' })
  remove(@Param('id') id: string): Promise<void> {
    return this.folders.remove(id);
  }
}
