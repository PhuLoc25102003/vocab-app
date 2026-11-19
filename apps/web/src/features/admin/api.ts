import {
  adminUserListResponseSchema,
  adminUserResponseSchema,
  type AdminUser,
  type AdminUserList,
} from '@vocab/shared';
import { http } from '@/lib/http';

export const ADMIN_USERS_PAGE_SIZE = 20;

export const adminKeys = {
  users: ['admin', 'users'] as const,
  userList: (page: number, q: string) => ['admin', 'users', page, q] as const,
};

export async function listAdminUsers(page: number, q: string): Promise<AdminUserList> {
  const params = new URLSearchParams({ page: String(page), limit: String(ADMIN_USERS_PAGE_SIZE) });
  if (q) {
    params.set('q', q);
  }
  return adminUserListResponseSchema.parse(await http(`/admin/users?${params.toString()}`));
}

export async function lockUser(id: string, reason: string): Promise<AdminUser> {
  const body = await http(`/admin/users/${encodeURIComponent(id)}/lock`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return adminUserResponseSchema.parse(body).data;
}

export async function unlockUser(id: string): Promise<AdminUser> {
  const body = await http(`/admin/users/${encodeURIComponent(id)}/unlock`, { method: 'PATCH' });
  return adminUserResponseSchema.parse(body).data;
}
