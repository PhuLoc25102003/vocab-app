import { SetMetadata } from '@nestjs/common';
import type { Role } from '@vocab/shared';

export const ROLES_KEY = 'roles';

/** Chỉ các vai trò được liệt kê mới gọi được route. ADMIN cũng phải ghi rõ. */
export const Roles = (...roles: [Role, ...Role[]]) => SetMetadata(ROLES_KEY, roles);
