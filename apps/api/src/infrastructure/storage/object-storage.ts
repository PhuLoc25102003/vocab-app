import { presignUrl } from './sigv4';

export interface PresignPutInput {
  key: string;
  contentType: string;
  size: number;
  expiresInSeconds: number;
}

export interface PresignedPut {
  uploadUrl: string;
  /** Header trình duyệt phải gửi kèm, đã nằm trong chữ ký. */
  headers: Record<string, string>;
  publicUrl: string;
}

/** Cổng tới kho tệp. Bản dùng được chọn trong `StorageModule` theo biến môi trường. */
export abstract class ObjectStorage {
  abstract presignPut(input: PresignPutInput): PresignedPut;
  /** Địa chỉ công khai gốc, dùng để kiểm tra ảnh của thẻ có thuộc kho của app. */
  abstract readonly publicBaseUrl: string;
}

/** Token DI, giá trị là `ObjectStorage` hoặc `null` khi chưa cấu hình R2. */
export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

export class R2Storage extends ObjectStorage {
  readonly publicBaseUrl: string;

  constructor(
    private readonly config: R2Config,
    private readonly now: () => Date = () => new Date(),
  ) {
    super();
    this.publicBaseUrl = config.publicUrl.replace(/\/$/, '');
  }

  presignPut({ key, contentType, size, expiresInSeconds }: PresignPutInput): PresignedPut {
    // Ký cả dung lượng và loại tệp để người tải lên không gửi được tệp khác đã khai báo.
    const headers = { 'content-length': String(size), 'content-type': contentType };
    const uploadUrl = presignUrl({
      method: 'PUT',
      host: `${this.config.accountId}.r2.cloudflarestorage.com`,
      path: `/${this.config.bucket}/${key}`,
      region: 'auto',
      service: 's3',
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      date: this.now(),
      expiresInSeconds,
      headers,
    });
    // Trình duyệt tự đặt Content-Length từ nội dung tệp, chỉ cần gửi Content-Type.
    return {
      uploadUrl,
      headers: { 'content-type': contentType },
      publicUrl: `${this.publicBaseUrl}/${key}`,
    };
  }
}
