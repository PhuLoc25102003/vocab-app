import { applyDecorators, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/** Đánh dấu route không cần đăng nhập. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Khách gọi được. Nếu có access token thì xác thực, đọc bằng `@OptionalUser()`. */
export const OptionalAuth = () => applyDecorators(Public(), SetMetadata(OPTIONAL_AUTH_KEY, true));
