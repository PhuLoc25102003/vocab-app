import {
  notificationListSchema,
  notificationPrefsResponseSchema,
  pushConfigResponseSchema,
  unreadCountResponseSchema,
  xpSummaryResponseSchema,
  type NotificationList,
  type NotificationPrefs,
  type PushConfig,
  type PushSubscriptionInput,
  type XpSummary,
} from '@vocab/shared';
import { http } from '@/lib/http';

/** Số thông báo hiện trong chuông mỗi lần mở. */
export const NOTIFICATION_PAGE_SIZE = 20;

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  list: ['notifications', 'list'] as const,
};

export async function getUnreadCount(): Promise<number> {
  return unreadCountResponseSchema.parse(await http('/notifications/unread-count')).data.count;
}

export async function listNotifications(): Promise<NotificationList> {
  const body = await http(`/notifications?page=1&limit=${NOTIFICATION_PAGE_SIZE}`);
  return notificationListSchema.parse(body);
}

export async function markNotificationRead(id: string): Promise<void> {
  await http(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await http('/notifications/read-all', { method: 'POST' });
}

export async function getPushConfig(): Promise<PushConfig> {
  return pushConfigResponseSchema.parse(await http('/push/config')).data;
}

export async function savePushSubscription(input: PushSubscriptionInput): Promise<void> {
  await http('/push/subscriptions', { method: 'POST', body: JSON.stringify(input) });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await http('/push/subscriptions/remove', { method: 'POST', body: JSON.stringify({ endpoint }) });
}

/**
 * Cùng khoá và cùng kiểu dữ liệu với khối XP ở Tổng quan nên dùng chung cache, không gọi thêm API.
 * Dùng để biết người học đã học chưa.
 */
export const XP_KEY = ['stats', 'xp'] as const;

export async function getXpSummary(): Promise<XpSummary> {
  return xpSummaryResponseSchema.parse(await http('/stats/xp')).data;
}

/** Huỷ nhận mail nhắc học bằng token trong mail, không cần đăng nhập. */
export async function unsubscribeReminders(token: string): Promise<void> {
  await http('/notifications/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ token }),
    skipAuth: true,
  });
}

export const PREFS_KEY = ['notifications', 'prefs'] as const;

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return notificationPrefsResponseSchema.parse(await http('/notifications/prefs')).data;
}

export async function updateNotificationPrefs(
  changes: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const body = await http('/notifications/prefs', { method: 'PUT', body: JSON.stringify(changes) });
  return notificationPrefsResponseSchema.parse(body).data;
}

export async function sendTestPush(): Promise<void> {
  await http('/push/test', { method: 'POST' });
}
