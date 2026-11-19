import {
  adminStatsResponseSchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  hiddenSetResponseSchema,
  type AdminStats,
  type AdminUser,
  type AdminUserList,
  type HiddenSet,
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

export async function hideSet(id: string, reason: string): Promise<HiddenSet> {
  const body = await http(`/admin/sets/${encodeURIComponent(id)}/hide`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return hiddenSetResponseSchema.parse(body).data;
}

export async function unhideSet(id: string): Promise<HiddenSet> {
  const body = await http(`/admin/sets/${encodeURIComponent(id)}/unhide`, { method: 'PATCH' });
  return hiddenSetResponseSchema.parse(body).data;
}

export async function getAdminStats(): Promise<AdminStats> {
  return adminStatsResponseSchema.parse(await http('/admin/stats')).data;
}
