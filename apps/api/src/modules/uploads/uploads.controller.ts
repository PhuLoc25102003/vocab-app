import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { presignImageSchema, type PresignImageInput } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { CurrentUser, type CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Tải ảnh lên đã bật chưa, giới hạn dung lượng và loại ảnh' })
  getConfig() {
    return this.uploads.getConfig();
  }

  @Get('search-images')
  @ApiOperation({ summary: 'Tìm ảnh minh hoạ trực tuyến theo từ khoá' })
  searchImages(@Query('query') query = '') {
    return this.uploads.searchImages(query);
  }

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'URL ký sẵn 5 phút để tải một ảnh của thẻ lên R2' })
  @ApiZodBody(presignImageSchema)
  presign(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(presignImageSchema)) dto: PresignImageInput,
  ) {
    return this.uploads.presignImage(user.id, dto);
  }
}
