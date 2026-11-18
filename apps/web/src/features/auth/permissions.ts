import type { AuthUser, Role } from '@vocab/shared';

export type OwnedAction = 'update' | 'delete';
export type RoleAction = 'manage-classes' | 'manage-users';
export type Action = OwnedAction | RoleAction;

export interface OwnedResource {
  ownerId: string;
}

const ROLE_ACTIONS: Record<RoleAction, readonly Role[]> = {
  'manage-classes': ['TEACHER', 'ADMIN'],
  'manage-users': ['ADMIN'],
};

/** Chỉ để ẩn hiện giao diện. Backend luôn là nơi quyết định quyền. */
export function can(user: AuthUser | null, action: Action, resource?: OwnedResource): boolean {
  if (!user) {
    return false;
  }
  if (action === 'update' || action === 'delete') {
    return user.role === 'ADMIN' || resource?.ownerId === user.id;
  }
  return ROLE_ACTIONS[action].includes(user.role);
}
