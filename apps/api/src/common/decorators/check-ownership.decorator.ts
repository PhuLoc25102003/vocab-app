import { SetMetadata } from '@nestjs/common';
import type { OwnedResource } from '../auth/ownership.repository';

export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipCheck {
  resource: OwnedResource;
  param: string;
}

/** Người gọi phải sở hữu tài nguyên có id nằm trong tham số `param` của đường dẫn. */
export const CheckOwnership = (resource: OwnedResource, param = 'id') =>
  SetMetadata<string, OwnershipCheck>(CHECK_OWNERSHIP_KEY, { resource, param });
