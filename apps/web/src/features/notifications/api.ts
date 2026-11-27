import {
  notificationListSchema,
  unreadCountResponseSchema,
  type NotificationList,
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
