import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES, MAX_CARDS_PER_SET, parseImport, type ImportPreviewDto } from '@vocab/shared';
import { ok } from '../../common/base/pagination';
import { AppError } from '../../common/errors/app-error';

@Injectable()
export class ImportService {
  /** Chỉ phân tích, không lưu gì. Người dùng sửa lỗi trên web rồi mới lưu. */
  preview({ content, options }: ImportPreviewDto) {
    const result = parseImport(content, options);
    if (result.rows.length > MAX_CARDS_PER_SET) {
      throw new AppError(
        ERROR_CODES.IMPORT_TOO_MANY_ROWS,
        `Mỗi lần nhập tối đa ${MAX_CARDS_PER_SET} dòng, nội dung đang có ${result.rows.length} dòng`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        { max: MAX_CARDS_PER_SET, rows: result.rows.length },
      );
    }
    return ok(result);
  }
}
