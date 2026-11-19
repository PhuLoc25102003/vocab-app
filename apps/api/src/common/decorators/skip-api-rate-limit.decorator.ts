import { SetMetadata } from '@nestjs/common';

export const SKIP_API_RATE_LIMIT_KEY = 'skipApiRateLimit';

/** Bỏ giới hạn chung, dùng cho route có giới hạn riêng hoặc cho health check. */
export const SkipApiRateLimit = () => SetMetadata(SKIP_API_RATE_LIMIT_KEY, true);
