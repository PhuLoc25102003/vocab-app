import {
  adminClassesOverviewResponseSchema,
  adminHiddenSetListResponseSchema,
  adminSetListResponseSchema,
  adminStatsResponseSchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  hiddenSetResponseSchema,
  type AdminClassesOverview,
  type AdminHiddenSetList,
  type AdminSetList,
  type AdminSetStatus,
  type AdminStats,
  type AdminUser,
  type AdminUserList,
  type AdminUserSort,
  type AdminUserStatus,
  type HiddenSet,
  type Role,
} from '@vocab/shared';
import { http } from '@/lib/http';

export const ADMIN_USERS_PAGE_SIZE = 20;
export const ADMIN_HIDDEN_SETS_PAGE_SIZE = 20;
export const ADMIN_SETS_PAGE_SIZE = 20;

/** Bộ lọc danh sách người dùng, nằm trong URL. */
export interface AdminUsersView {
  q: string;
  role?: Role;
  status?: AdminUserStatus;
  sort: AdminUserSort;
  page: number;
}

/** Bộ lọc danh sách bộ từ công khai & kiểm duyệt, nằm trong URL. */
export interface AdminSetsView {
  q: string;
  status: AdminSetStatus;
  page: number;
}

/** Bộ lọc danh sách bộ từ bị ẩn (tương thích ngược), nằm trong URL. */
export interface AdminHiddenSetsView {
  q: string;
  page: number;
}

export const adminKeys = {
  users: ['admin', 'users'] as const,
  userList: (view: AdminUsersView) =>
    ['admin', 'users', view.page, view.q, view.role, view.status, view.sort] as const,
  sets: ['admin', 'sets'] as const,
  setList: (view: AdminSetsView) => ['admin', 'sets', view.page, view.q, view.status] as const,
  hiddenSets: ['admin', 'hidden-sets'] as const,
  hiddenSetList: (view: AdminHiddenSetsView) =>
    ['admin', 'hidden-sets', view.page, view.q] as const,
  classesOverview: ['admin', 'classes', 'overview'] as const,
  stats: ['admin', 'stats'] as const,
};

export async function listAdminUsers(view: AdminUsersView): Promise<AdminUserList> {
  const params = new URLSearchParams({
    page: String(view.page),
    limit: String(ADMIN_USERS_PAGE_SIZE),
    sort: view.sort,
  });
  if (view.q) params.set('q', view.q);
  if (view.role) params.set('role', view.role);
  if (view.status) params.set('status', view.status);
  return adminUserListResponseSchema.parse(await http(`/admin/users?${params.toString()}`));
}

export async function listPublicSets(view: AdminSetsView): Promise<AdminSetList> {
  const params = new URLSearchParams({
    page: String(view.page),
    limit: String(ADMIN_SETS_PAGE_SIZE),
    status: view.status,
  });
  if (view.q) params.set('q', view.q);
  return adminSetListResponseSchema.parse(await http(`/admin/sets?${params.toString()}`));
}

export async function listHiddenSets(view: AdminHiddenSetsView): Promise<AdminHiddenSetList> {
  const params = new URLSearchParams({
    page: String(view.page),
    limit: String(ADMIN_HIDDEN_SETS_PAGE_SIZE),
  });
  if (view.q) params.set('q', view.q);
  return adminHiddenSetListResponseSchema.parse(
    await http(`/admin/sets/hidden?${params.toString()}`),
  );
}

export async function getAdminClassesOverview(): Promise<AdminClassesOverview> {
  const body = await http('/admin/classes/overview');
  return adminClassesOverviewResponseSchema.parse(body).data;
}

export async function lockUser(id: string, reason: string): Promise<AdminUser> {
  const body = await http(`/admin/users/${encodeURIComponent(id)}/lock`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return adminUserResponseSchema.parse(body).data;
}

export async function setUserRole(id: string, role: Role): Promise<AdminUser> {
  const body = await http(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
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
