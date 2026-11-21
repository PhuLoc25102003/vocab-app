import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { importPreviewSchema, type ImportPreviewDto } from '@vocab/shared';
import { ApiZodBody } from '../../common/decorators/api-zod-body.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ImportService } from './import.service';

@ApiTags('import')
@ApiBearerAuth()
@Controller('import')
export class ImportController {
  constructor(private readonly imports: ImportService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phân tích text hoặc CSV, trả từng dòng kèm lỗi' })
  @ApiZodBody(importPreviewSchema)
  preview(@Body(new ZodValidationPipe(importPreviewSchema)) dto: ImportPreviewDto) {
    return this.imports.preview(dto);
  }
}
